import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { WSContext } from 'hono/ws'
import { RouterContextProvider } from 'react-router'
import { createHonoServer } from 'react-router-hono-server/bun'
import { dbContext } from '../app/contexts/db'
import { getSession } from '../app/routes/_auth+/_shared/session.server'
import { messages, relations, users } from '../db/schema'
import { parseWithZod } from '@conform-to/zod/v4'
import { SendMessageSchema } from '../app/routes/channels+/@me+/$channelId+/model/message'

// Store WebSocket connections per channel
const channelConnections = new Map<string, Set<WSContext>>()

// Create shared database instance
const db = drizzle(process.env.DATABASE_URL, { relations })

const honoServer = await createHonoServer({
  defaultLogger: false,
  useWebSocket: true,
  configure(app, { upgradeWebSocket }) {
    app.get('/api', (c) => c.text('hello'))

    // WebSocket endpoint for real-time chat
    app.get(
      '/ws/channels/:channelId',
      upgradeWebSocket((c) => {
        const channelId = c.req.param('channelId')

        return {
          async onOpen(_event, ws) {
            // Authenticate user
            const session = await getSession(
              new Request(c.req.url, { headers: c.req.raw.headers }),
            )
            const userId = session.get('userId')

            if (!userId) {
              console.log('WebSocket rejected: not authenticated')
              ws.close()
              return
            }
            // Store userId with connection
            ;(ws as WSContext & { userId?: number }).userId = userId

            // Verify channel membership
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
              const submission = parseWithZod(data, {
                schema: SendMessageSchema,
              })

              if (submission.status !== 'success') {
                console.error('Invalid message format')
                ws.send(
                  JSON.stringify({
                    type: 'error',
                    error: 'Invalid message format',
                  }),
                )
                return
              }

              const userId = (ws as WSContext & { userId?: number }).userId

              if (!userId) {
                console.error('User ID not found')
                return
              }

              // Persist to database
              const [insertedMessage] = await db
                .insert(messages)
                .values({
                  content: submission.value.content,
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
                return
              }

              // Fetch sender info
              const [sender] = await db
                .select({ id: users.id, name: users.name })
                .from(users)
                .where(eq(users.id, userId))

              if (!sender) {
                console.error('Sender not found')
                return
              }

              // Prepare broadcast with real DB data
              const broadcastData = {
                type: 'message',
                data: {
                  id: insertedMessage.id,
                  content: insertedMessage.content,
                  createdAt: insertedMessage.createdAt,
                  sender: {
                    id: sender.id,
                    name: sender.name,
                  },
                  tempId: data.id, // Client's temp ID for matching
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
  },
  getLoadContext() {
    const context = new RouterContextProvider()
    context.set(dbContext, db)
    return context
  },
})

export default honoServer
