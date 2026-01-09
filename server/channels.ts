import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { UpgradeWebSocket, WSContext } from 'hono/ws'
import { db } from '../app/contexts/db'
import { getSession } from '../app/routes/_auth+/_shared/session.server'
import {
  type MessageType,
  SendMessageSchema,
} from '../app/routes/channels+/@me+/$channelId+/model/message'
import { messages, users } from '../db/schema'

// Store WebSocket connections per channel
const channelConnections = new Map<string, Set<WSContext>>()

export const channels = (upgradeWebSocket: UpgradeWebSocket) =>
  new Hono().get(
    '/:channelId/ws',
    upgradeWebSocket((c) => {
      const channelId = c.req.param('channelId')
      let userId: number | undefined

      return {
        async onOpen(_event, ws) {
          // Authenticate user
          const session = await getSession(
            new Request(c.req.url, { headers: c.req.raw.headers }),
          )

          userId = session.get('userId')

          if (!userId) {
            console.log('WebSocket rejected: not authenticated')
            ws.close()
            return
          }

          // Verify channel membership
          const channel = await db.query.channels.findFirst({
            where: {
              id: Number(channelId),
            },
            with: {
              participants: true,
            },
          })

          if (!channel || !channel.participants.some((p) => p.id === userId)) {
            console.log('WebSocket rejected: user not a participant of channel')
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

          try {
            const data = JSON.parse(event.data as string)
            const { data: msgContent, success } = SendMessageSchema.omit({
              intent: true,
            }).safeParse(data)

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

            await db.transaction(async (tx) => {
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
                return
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
                sender,
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
            })
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
