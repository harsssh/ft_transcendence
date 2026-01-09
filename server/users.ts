import { Hono } from 'hono'
import type { UpgradeWebSocket } from 'hono/ws'
import { presenceClient } from '../app/contexts/presence'
import { getSession } from '../app/routes/_auth+/_shared/session.server'
import { ResultAsync } from 'neverthrow'

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
            ResultAsync.fromPromise(
              presenceClient.set(`user:${userId}`, 'online'),
              (e) => {
                console.error('Failed to set presence status:', e)
              },
            )
          },

          async onClose() {
            console.log(`Presence ${userId}: offline`)
            ResultAsync.fromPromise(
              presenceClient.set(`user:${userId}`, 'offline'),
              (e) => {
                console.error('Failed to set presence status:', e)
              },
            )
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
      const status = ResultAsync.fromPromise(
        presenceClient.get(`user:${targetUserId}`),
        (e) => {
          console.error('Failed to get presence status:', e)
        },
      ).match(
        (status) => status,
        () => 'offline',
      )
      return c.json({ status: status ?? 'offline' })
    })
