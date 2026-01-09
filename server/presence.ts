import { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'
import { presenceClient } from '../app/contexts/presence'
import { getSession } from '../app/routes/_auth+/_shared/session.server'

export const presence = (upgradeWebSocket: UpgradeWebSocket) =>
  new Hono().get(
    '/ws',
    upgradeWebSocket(async (c) => {
      // Authenticate user
      const session = await getSession(
        new Request(c.req.url, { headers: c.req.raw.headers }),
      )

      const userId = session.get('userId')
      if (!userId) {
        console.log('WebSocket rejected: not authenticated')
        throw new Error('Not authenticated')
      }

      return {
        async onOpen() {
          console.log(`Presence ${userId}: online`)
          await presenceClient.set(`user:${userId}`, 'online')
        },

        async onClose() {
          console.log(`Presence ${userId}: offline`)
          await presenceClient.set(`user:${userId}`, 'offline')
        },
      }
    }),
  )
