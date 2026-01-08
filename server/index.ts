import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { WSContext } from 'hono/ws'
import { RouterContextProvider } from 'react-router'
import { createHonoServer } from 'react-router-hono-server/bun'
import { dbContext } from '../app/contexts/db'
import { AVATAR_BUCKET, storageContext } from '../app/contexts/storage'
import { getSession } from '../app/routes/_auth+/_shared/session.server'
import { SendMessageSchema } from '../app/routes/channels+/@me+/$channelId+/model/message'
import { messages, relations, users } from '../db/schema'

// Store WebSocket connections per channel
const channelConnections = new Map<string, Set<WSContext>>()

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const db = drizzle(dbUrl, { relations })

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://storage:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
})

// Initialize MinIO bucket
async function initializeStorage() {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: AVATAR_BUCKET }))
    console.log(`Bucket "${AVATAR_BUCKET}" already exists`)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'NotFound' || error.name === '404')
    ) {
      // Create bucket if it doesn't exist
      await s3Client.send(new CreateBucketCommand({ Bucket: AVATAR_BUCKET }))
      console.log(`Bucket "${AVATAR_BUCKET}" created`)

      // Set public read policy
      const publicPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${AVATAR_BUCKET}/*`],
          },
        ],
      }

      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: AVATAR_BUCKET,
          Policy: JSON.stringify(publicPolicy),
        }),
      )
      console.log(`Public policy set for bucket "${AVATAR_BUCKET}"`)
    } else {
      console.error('Error checking bucket:', error)
    }
  }
}

// Run storage initialization
await initializeStorage()

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

              const userId = (ws as WSContext & { userId?: number }).userId

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
                  .select({ id: users.id, name: users.name })
                  .from(users)
                  .where(eq(users.id, userId))

                if (!sender) {
                  console.error('Sender not found')
                  return tx.rollback()
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
  },
  getLoadContext() {
    const context = new RouterContextProvider()
    context.set(dbContext, db)
    context.set(storageContext, s3Client)
    return context
  },
})

export default honoServer
