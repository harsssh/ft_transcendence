import { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'
import { ResultAsync } from 'neverthrow'
import { presenceClient } from '../app/contexts/presence'
import { getSession } from '../app/routes/_auth+/_shared/session.server'

const PRESENCE_EXPIRATION_SECONDS = 60 * 5 // 5 minutes

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
            try {
              await presenceClient.set(`user:${userId}`, 'online')
            } catch (e) {
              console.log('Failed to set presence status:', e)
            }
          },

          async onClose() {
            console.log(`Presence ${userId}: offline`)
            try {
              await presenceClient.set(`user:${userId}`, 'offline', {
                expiration: { type: 'EX', value: PRESENCE_EXPIRATION_SECONDS },
              })
            } catch (e) {
              console.log('Failed to set presence status:', e)
            }
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
      const status = await ResultAsync.fromPromise(
        presenceClient.get(`user:${targetUserId}`),
        (e) => {
          console.log('Failed to get presence status:', e)
        },
      ).match(
        (status) => status,
        () => 'offline',
      )
      return c.json({ status: status ?? 'offline' })
    })
