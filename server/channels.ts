import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { UpgradeWebSocket, WSContext } from 'hono/ws'
import { processRefineRequest } from '../3D/api/refine'
import { resume3DGeneration } from '../3D/jobs/processor'
import { checkRateLimit, releaseJobLock } from '../3D/ratelimit'
import { db } from '../app/contexts/db'
import { STORAGE_PUBLIC_ENDPOINT } from '../app/contexts/storage'
import { getSession } from '../app/routes/_auth+/_shared/session.server'
import {
  type MessageType,
  SendMessageSchema,
} from '../app/routes/channels+/_text/model/message'
import { message3DAssets, messages, users } from '../db/schema'
import { getMeshyApiKey } from './utils/env'

// Store WebSocket connections per channel
const channelConnections = new Map<string, Set<WSContext>>()

// Helper for broadcasting updates (Shared across WebSocket and HTTP endpoints)
const broadcastMessageUpdate = (
  channelId: number | string,
  messageId: number,
  data: { status: string; modelUrl: string | null; precedingTasks?: number },
) => {
  const cons = channelConnections.get(String(channelId))
  if (cons) {
    const updateMsg = JSON.stringify({
      type: 'message_update',
      data: {
        id: messageId, // Frontend expects 'id' at root of data object
        ...data,
      },
    })
    for (const client of cons) {
      client.send(updateMsg)
    }
  }
}

export const channels = (upgradeWebSocket: UpgradeWebSocket) =>
  new Hono()
    .get(
      '/:channelId/ws',
      upgradeWebSocket((c) => {
        const channelId = c.req.param('channelId')
        let connectedUserId: number | undefined
        // Fix: Use a promise to track authentication state
        let authPromise: Promise<number | undefined>

        return {
          async onOpen(_event, ws) {
            // Authenticate user
            authPromise = (async () => {
              const session = await getSession(
                new Request(c.req.url, { headers: c.req.raw.headers }),
              )
              const userId = session.get('userId')
              connectedUserId = userId
              return userId
            })()

            await authPromise

            if (!connectedUserId) {
              console.log('WebSocket rejected: not authenticated')
              ws.close()
              return
            }

            // Verify channel membership (DM)
            const channel = await db.query.channels.findFirst({
              where: {
                id: Number(channelId),
              },
              with: {
                participants: true,
              },
            })

            if (
              !channel ||
              !channel.participants.some((p) => p.id === connectedUserId)
            ) {
              console.log(
                'WebSocket rejected: user not a participant of channel',
              )
              ws.close()
              return
            }

            if (!channelConnections.has(channelId)) {
              channelConnections.set(channelId, new Set())
            }
            channelConnections.get(channelId)?.add(ws)
            console.log(`WebSocket opened for channel ${channelId}`)
          },

          async onMessage(event, ws) {
            console.log(`Message received: ${event.data}`)

            // Wait for authentication to complete
            if (authPromise) {
              await authPromise
            }

            const userId = connectedUserId

            try {
              const data = JSON.parse(event.data as string)
              const { data: msgContent, success } =
                SendMessageSchema.safeParse(data)

              if (!success) {
                console.error('Invalid message format')
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    error: 'Invalid message format',
                  }),
                )
                return
              }

              if (!userId) {
                console.error('User ID not found')
                return
              }

              const txResult = await db.transaction(async (tx) => {
                let trigger3D: {
                  prompt: string
                  messageId: number
                  assetId: number
                  channelId: number
                } | null = null

                const channel = await db.query.channels.findFirst({
                  where: {
                    id: Number(channelId),
                  },
                  with: {
                    participants: true,
                  },
                })

                if (
                  !channel ||
                  !channel.participants.some((p) => p.id === userId)
                ) {
                  console.log(
                    'WebSocket rejected: user not a participant of channel',
                  )
                  ws.close()
                  return { trigger3D: null }
                }

                const [insertedMessage] = await tx
                  .insert(messages)
                  .values({
                    content: msgContent.content,
                    channelId: Number(channelId),
                    senderId: userId,
                  })
                  .returning()

                if (!insertedMessage) {
                  console.error('Failed to insert message')
                  ws.send(
                    JSON.stringify({
                      type: 'error',
                      error: 'Failed to insert message',
                    }),
                  )
                  return tx.rollback()
                }

                // Fetch sender info
                const [sender] = await db
                  .select({
                    id: users.id,
                    name: users.name,
                    displayName: users.displayName,
                    avatarUrl: users.avatarUrl,
                  })
                  .from(users)
                  .where(eq(users.id, userId))

                if (!sender) {
                  console.error('Sender not found')
                  return tx.rollback()
                }

                // Prepare broadcast with real DB data
                const broadcastData: MessageType = {
                  id: insertedMessage.id,
                  content: insertedMessage.content,
                  createdAt: insertedMessage.createdAt,
                  sender: {
                    ...sender,
                    avatarUrl: `${STORAGE_PUBLIC_ENDPOINT}/${sender.avatarUrl}`,
                  },
                }

                // Broadcast to ALL clients (including sender)
                const connections = channelConnections.get(channelId)
                if (connections) {
                  const message = JSON.stringify(broadcastData)
                  for (const client of connections) {
                    client.send(message)
                  }
                  console.log(`Broadcast to ${connections.size} clients`)
                }

                // 3D Generation Trigger Logic captured here but executed AFTER transaction
                if (msgContent.content.startsWith('/3D -URL ')) {
                  const url = msgContent.content.slice(9).trim()
                  // Basic URL validation
                  if (
                    url &&
                    (url.startsWith('http://') || url.startsWith('https://'))
                  ) {
                    const [asset] = await tx
                      .insert(message3DAssets)
                      .values({
                        messageId: insertedMessage.id,
                        prompt: 'Imported from URL',
                        status: 'refined', // Disables Refine button
                        modelUrl: url,
                      })
                      .returning()

                    if (asset) {
                      // Immediate broadcast of the 'refined' asset
                      const cons = channelConnections.get(channelId)
                      if (cons) {
                        const updateMsg = JSON.stringify({
                          type: 'message_update',
                          data: {
                            id: insertedMessage.id,
                            status: 'refined',
                            modelUrl: url,
                          },
                        })
                        for (const client of cons) {
                          client.send(updateMsg)
                        }
                      }
                    }
                  }
                } else if (msgContent.content.startsWith('/3D ')) {
                  const limitResult = await checkRateLimit(userId)
                  if (!limitResult.allowed) {
                    ws.send(
                      JSON.stringify({
                        type: 'error',
                        error: `Rate limit exceeded. Please wait ${limitResult.remaining} seconds.`,
                      }),
                    )
                    return { trigger3D: null }
                  }
                  const prompt = msgContent.content.slice(4).trim()
                  if (prompt) {
                    const [asset] = await tx
                      .insert(message3DAssets)
                      .values({
                        messageId: insertedMessage.id,
                        prompt,
                        status: 'queued',
                      })
                      .returning()

                    if (asset) {
                      trigger3D = {
                        prompt,
                        messageId: insertedMessage.id,
                        assetId: asset.id,
                        channelId: Number(channelId),
                      }
                    }
                  }
                }

                return { trigger3D }
              })

              // Execute 3D Generation AFTER transaction commit
              if (txResult?.trigger3D) {
                const { prompt, messageId, assetId, channelId } =
                  txResult.trigger3D

                // Helper for broadcasting updates from processor
                const broadcastUpdate = (
                  cId: number,
                  mId: number,
                  asset: {
                    status: string
                    modelUrl: string | null
                    precedingTasks?: number
                  },
                ) => {
                  broadcastMessageUpdate(cId, mId, asset)
                }

                resume3DGeneration(
                  db,
                  channelId,
                  messageId,
                  assetId,
                  prompt,
                  broadcastUpdate,
                ).catch((e) => console.error(e))
              }
            } catch (error) {
              console.error('Error handling message:', error)
              ws.send(
                JSON.stringify({
                  type: 'error',
                  error: 'Failed to send message',
                }),
              )
            }
          },

          onClose(_event, ws) {
            console.log(`WebSocket closed for channel ${channelId}`)
            const connections = channelConnections.get(channelId)
            if (connections) {
              connections.delete(ws)
              if (connections.size === 0) {
                channelConnections.delete(channelId)
              }
            }
          },

          onError(event) {
            console.error(`WebSocket error:`, event)
          },
        }
      }),
    )
    .get(
      '/guild/:channelId/ws',
      upgradeWebSocket((c) => {
        const channelId = c.req.param('channelId')
        let connectedUserId: number | undefined
        // Fix: Use a promise to track authentication state
        let authPromise: Promise<number | undefined>

        return {
          async onOpen(_event, ws) {
            // Authenticate user
            authPromise = (async () => {
              const session = await getSession(
                new Request(c.req.url, { headers: c.req.raw.headers }),
              )
              const userId = session.get('userId')
              connectedUserId = userId
              return userId
            })()

            await authPromise

            if (!connectedUserId) {
              console.log('WebSocket rejected: not authenticated')
              ws.close()
              return
            }

            // Verify guild membership
            const channel = await db.query.channels.findFirst({
              where: {
                id: Number(channelId),
              },
              with: {
                guild: {
                  with: {
                    members: true,
                  },
                },
              },
            })

            const isMember = channel?.guild?.members.some(
              (m) => m.id === connectedUserId,
            )

            if (!channel || !isMember) {
              console.log('WebSocket rejected: user not a member of the guild')
              ws.close()
              return
            }

            if (!channelConnections.has(channelId)) {
              channelConnections.set(channelId, new Set())
            }
            channelConnections.get(channelId)?.add(ws)
            console.log(`WebSocket opened for guild channel ${channelId}`)
          },

          async onMessage(event, ws) {
            console.log(`Message received: ${event.data}`)

            // Wait for authentication to complete
            if (authPromise) {
              await authPromise
            }

            const userId = connectedUserId

            try {
              const data = JSON.parse(event.data as string)
              const { data: msgContent, success } =
                SendMessageSchema.safeParse(data)

              if (!success) {
                console.error('Invalid message format')
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    error: 'Invalid message format',
                  }),
                )
                return
              }

              if (!userId) {
                console.error('User ID not found')
                return
              }

              const txResult = await db.transaction(async (tx) => {
                let trigger3D: {
                  prompt: string
                  messageId: number
                  assetId: number
                  channelId: number
                } | null = null

                const channel = await db.query.channels.findFirst({
                  where: {
                    id: Number(channelId),
                  },
                  with: {
                    guild: {
                      with: {
                        members: true,
                      },
                    },
                  },
                })

                const isMember = channel?.guild?.members.some(
                  (m) => m.id === userId,
                )

                if (!channel || !isMember) {
                  console.log(
                    'WebSocket rejected: user not a member of the guild',
                  )
                  ws.close()
                  return { trigger3D: null }
                }

                const [insertedMessage] = await tx
                  .insert(messages)
                  .values({
                    content: msgContent.content,
                    channelId: Number(channelId),
                    senderId: userId,
                  })
                  .returning()

                if (!insertedMessage) {
                  console.error('Failed to insert message')
                  ws.send(
                    JSON.stringify({
                      type: 'error',
                      error: 'Failed to insert message',
                    }),
                  )
                  return tx.rollback()
                }

                if (!channel?.guild?.id) {
                  console.error('Unexpected error: Guild ID missing')
                  return tx.rollback()
                }

                // Fetch sender info
                const sender = await tx.query.users.findFirst({
                  where: {
                    id: userId,
                  },
                  columns: {
                    id: true,
                    name: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                  with: {
                    roles: {
                      where: {
                        guildId: channel?.guild?.id,
                      },
                      orderBy: {
                        id: 'asc',
                      },
                    },
                  },
                })

                if (!sender) {
                  console.error('Sender not found')
                  return tx.rollback()
                }

                // Prepare broadcast with real DB data
                const broadcastData: MessageType = {
                  id: insertedMessage.id,
                  content: insertedMessage.content,
                  createdAt: insertedMessage.createdAt,
                  sender: {
                    ...sender,
                    avatarUrl: `${STORAGE_PUBLIC_ENDPOINT}/${sender.avatarUrl}`,
                    roles: sender.roles.map((role) => ({
                      id: role.id,
                      name: role.name,
                      color: role.color,
                    })),
                  },
                }

                // Broadcast to ALL clients (including sender)
                const connections = channelConnections.get(channelId)
                if (connections) {
                  const message = JSON.stringify(broadcastData)
                  for (const client of connections) {
                    client.send(message)
                  }
                  console.log(`Broadcast to ${connections.size} clients`)
                }

                // 3D Generation Trigger Logic captured here but executed AFTER transaction
                if (msgContent.content.startsWith('/3D -URL ')) {
                  const url = msgContent.content.slice(9).trim()
                  // Basic URL validation
                  if (
                    url &&
                    (url.startsWith('http://') || url.startsWith('https://'))
                  ) {
                    const [asset] = await tx
                      .insert(message3DAssets)
                      .values({
                        messageId: insertedMessage.id,
                        prompt: 'Imported from URL',
                        status: 'refined', // Disables Refine button
                        modelUrl: url,
                      })
                      .returning()

                    if (asset) {
                      // Immediate broadcast of the 'refined' asset
                      const cons = channelConnections.get(channelId)
                      if (cons) {
                        const updateMsg = JSON.stringify({
                          type: 'message_update',
                          data: {
                            id: insertedMessage.id,
                            status: 'refined',
                            modelUrl: url,
                          },
                        })
                        for (const client of cons) {
                          client.send(updateMsg)
                        }
                      }
                    }
                  }
                } else if (msgContent.content.startsWith('/3D ')) {
                  const limitResult = await checkRateLimit(userId)
                  if (!limitResult.allowed) {
                    ws.send(
                      JSON.stringify({
                        type: 'error',
                        error: `Rate limit exceeded. Please wait ${limitResult.remaining} seconds.`,
                      }),
                    )
                    return { trigger3D: null }
                  }
                  const prompt = msgContent.content.slice(4).trim()
                  if (prompt) {
                    const [asset] = await tx
                      .insert(message3DAssets)
                      .values({
                        messageId: insertedMessage.id,
                        prompt,
                        status: 'queued',
                      })
                      .returning()

                    if (asset) {
                      trigger3D = {
                        prompt,
                        messageId: insertedMessage.id,
                        assetId: asset.id,
                        channelId: Number(channelId),
                      }
                    }
                  }
                }

                return { trigger3D }
              })

              // Execute 3D Generation AFTER transaction commit
              if (txResult?.trigger3D) {
                const { prompt, messageId, assetId, channelId } =
                  txResult.trigger3D

                // Helper for broadcasting updates from processor
                const broadcastUpdate = (
                  cId: number,
                  mId: number,
                  asset: { status: string; modelUrl: string | null },
                ) => {
                  const cons = channelConnections.get(String(cId))
                  if (cons) {
                    const updateMsg = JSON.stringify({
                      type: 'message_update',
                      data: {
                        id: mId,
                        ...asset,
                      },
                    })
                    for (const client of cons) {
                      client.send(updateMsg)
                    }
                  }
                }

                resume3DGeneration(
                  db,
                  channelId,
                  messageId,
                  assetId,
                  prompt,
                  broadcastUpdate,
                  () => releaseJobLock(userId),
                ).catch((e) => {
                  console.error(e)
                  releaseJobLock(userId)
                })
              }
            } catch (error) {
              console.error('Error handling message:', error)
              ws.send(
                JSON.stringify({
                  type: 'error',
                  error: 'Failed to send message',
                }),
              )
            }
          },

          onClose(_event, ws) {
            console.log(`WebSocket closed for guild channel ${channelId}`)
            const connections = channelConnections.get(channelId)
            if (connections) {
              connections.delete(ws)
              if (connections.size === 0) {
                channelConnections.delete(channelId)
              }
            }
          },

          onError(event) {
            console.error(`WebSocket error:`, event)
          },
        }
      }),
    )
    // [3D Refine] Added Refine endpoint
    .post('/:channelId/messages/:messageId/asset/refine', async (c) => {
      const channelId = parseInt(c.req.param('channelId'), 10)
      const messageId = parseInt(c.req.param('messageId'), 10)
      const apiKey = getMeshyApiKey()

      if (!apiKey) return c.json({ error: 'API Key not configured' }, 500)

      try {
        // [Security] Auth check
        const session = await getSession(c.req.raw)
        const userId = session.get('userId')
        if (!userId) return c.json({ error: 'Unauthorized' }, 401)

        // [Security] Ownership check
        const [message] = await db
          .select()
          .from(messages)
          .where(eq(messages.id, messageId))
          .limit(1)
        if (!message) return c.json({ error: 'Message not found' }, 404)
        if (message.senderId !== userId)
          return c.json({ error: 'Forbidden' }, 403)
        if (message.channelId !== channelId)
          return c.json({ error: 'Invalid channel' }, 400)

        // Reuse broadcast logic
        const broadcastUpdate = (
          cId: number,
          mId: number,
          update: { status: string; modelUrl: string | null },
        ) => {
          broadcastMessageUpdate(cId, mId, update)
        }

        const result = await processRefineRequest(
          messageId,
          channelId,
          apiKey,
          broadcastUpdate,
        )
        return c.json(result)
      } catch (e: unknown) {
        console.error('Refine error:', e)
        const errorMessage = e instanceof Error ? e.message : 'Refine failed'
        return c.json({ error: errorMessage }, 500)
      }
    })
    // [3D Refine] Added Revert endpoint for failure recovery
    .post('/:channelId/messages/:messageId/asset/revert', async (c) => {
      const channelId = parseInt(c.req.param('channelId'), 10)
      const messageId = parseInt(c.req.param('messageId'), 10)

      try {
        // [Security] Auth check
        const session = await getSession(c.req.raw)
        const userId = session.get('userId')
        if (!userId) return c.json({ error: 'Unauthorized' }, 401)

        // [Security] Ownership check
        const [message] = await db
          .select()
          .from(messages)
          .where(eq(messages.id, messageId))
          .limit(1)
        if (!message) return c.json({ error: 'Message not found' }, 404)
        if (message.senderId !== userId)
          return c.json({ error: 'Forbidden' }, 403)
        if (message.channelId !== channelId)
          return c.json({ error: 'Invalid channel' }, 400)

        // 1. Get Asset
        const [asset] = await db
          .select()
          .from(message3DAssets)
          .where(eq(message3DAssets.messageId, messageId))
          .limit(1)

        if (!asset) return c.json({ error: 'Asset not found' }, 404)

        // 2. Reset Status to 'ready' (keep URL)
        await db
          .update(message3DAssets)
          .set({ status: 'ready', updatedAt: new Date() })
          .where(eq(message3DAssets.id, asset.id))

        // 3. Broadcast
        broadcastMessageUpdate(channelId, messageId, {
          status: 'ready',
          modelUrl: asset.modelUrl,
        })

        return c.json({ success: true, status: 'ready' })
      } catch (e: unknown) {
        console.error('Revert error:', e)
        const errorMessage = e instanceof Error ? e.message : 'Revert failed'
        return c.json({ error: errorMessage }, 500)
      }
    })
    // [3D Refine] Added Resume endpoint for timeout recovery
    .post('/:channelId/messages/:messageId/asset/resume', async (c) => {
      const channelId = parseInt(c.req.param('channelId'), 10)
      const messageId = parseInt(c.req.param('messageId'), 10)

      try {
        // [Security] Auth check
        const session = await getSession(c.req.raw)
        const userId = session.get('userId')
        if (!userId) return c.json({ error: 'Unauthorized' }, 401)

        // [Security] Ownership check
        const [message] = await db
          .select()
          .from(messages)
          .where(eq(messages.id, messageId))
          .limit(1)
        if (!message) return c.json({ error: 'Message not found' }, 404)
        if (message.senderId !== userId)
          return c.json({ error: 'Forbidden' }, 403)
        if (message.channelId !== channelId)
          return c.json({ error: 'Invalid channel' }, 400)

        // 1. Get Asset
        const [asset] = await db
          .select()
          .from(message3DAssets)
          .where(eq(message3DAssets.messageId, messageId))
          .limit(1)

        if (!asset) return c.json({ error: 'Asset not found' }, 404)

        // 2. Resume Generation (Polling)
        // Reuse broadcast logic
        const broadcastUpdate = (
          cId: number,
          mId: number,
          update: { status: string; modelUrl: string | null },
        ) => {
          const cons = channelConnections.get(String(cId))
          if (cons) {
            const updateMsg = JSON.stringify({
              type: 'message_update',
              data: {
                id: mId,
                ...update,
              },
            })
            for (const client of cons) {
              client.send(updateMsg)
            }
          }
        }

        // Set status to generating immediately to show UI feedback
        // But only if it's not already ready/refined?
        // Actually typical resume usage is from 'timeout' or 'generating' state.
        await db
          .update(message3DAssets)
          .set({ status: 'generating', updatedAt: new Date() })
          .where(eq(message3DAssets.id, asset.id))
        broadcastUpdate(channelId, messageId, {
          status: 'generating',
          modelUrl: asset.modelUrl,
        })

        // 3. Call Processor
        resume3DGeneration(
          db,
          channelId,
          messageId,
          asset.id,
          asset.prompt,
          broadcastUpdate,
          () => {},
        ).catch((e) => console.error('[Resume] Polling error:', e))

        return c.json({ success: true, status: 'generating' })
      } catch (e: unknown) {
        console.error('Resume error:', e)
        const errorMessage = e instanceof Error ? e.message : 'Resume failed'
        return c.json({ error: errorMessage }, 500)
      }
    })
