import { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'
import { presenceClient } from '../app/contexts/presence'
import { getSession } from '../app/routes/_auth+/_shared/session.server'

export const presence = (upgradeWebSocket: UpgradeWebSocket) =>
  new Hono()
    .get(
      '/ws',
      upgradeWebSocket(async (c) => {
        const session = await getSession(
          new Request(c.req.url, { headers: c.req.raw.headers }),
        )

        const userId = session.get('userId')
        if (!userId) {
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
    .get('/:userId', async (c) => {
      const session = await getSession(
        new Request(c.req.url, { headers: c.req.raw.headers }),
      )

      const userId = session.get('userId')
      if (!userId) {
        throw new Error('Not authenticated')
      }

      const targetUserId = c.req.param('userId')
      const status = await presenceClient.get(`user:${targetUserId}`)
      return c.json({ status: status ?? 'offline' })
    })
