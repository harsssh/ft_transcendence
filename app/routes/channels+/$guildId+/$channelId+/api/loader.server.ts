import { err, ok, ResultAsync } from 'neverthrow'
import z from 'zod'
import { dbContext } from '../../../../../contexts/db'
import { resolveStoragePublicEndpoint } from '../../../../../contexts/storage'
import { loggedInUserContext } from '../../../../../contexts/user.server'
import type { Route } from '../+types/route'

const DEFAULT_LOCALE = 'en-US'

const resolveLocale = (acceptLanguage: string | null) => {
  const locale = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim()
  if (!locale) {
    return DEFAULT_LOCALE
  }

  try {
    return Intl.getCanonicalLocales(locale)[0]
  } catch {
    return DEFAULT_LOCALE
  }
}

export const loader = async ({
  context,
  params,
  request,
}: Route.LoaderArgs) => {
  const user = context.get(loggedInUserContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const storagePublicEndpoint = resolveStoragePublicEndpoint(request)

  const db = context.get(dbContext)
  const { data: channelId, success: channelIdSuccess } = z.coerce
    .number()
    .safeParse(params.channelId)
  const { data: guildId, success: guildIdSuccess } = z.coerce
    .number()
    .safeParse(params.guildId)

  if (!channelIdSuccess || !guildIdSuccess) {
    throw new Response('Bad Request', { status: 400 })
  }

  const result = await ResultAsync.fromPromise(
    db.query.guildMembers.findFirst({
      where: {
        guildId: guildId,
        userId: user.id,
      },
    }),
    (val) => val,
  )
    .andThen((membership) => {
      if (!membership) {
        return err('FORBIDDEN')
      }

      return ResultAsync.fromPromise(
        db.query.channels.findFirst({
          where: {
            id: channelId,
          },
          with: {
            messages: {
              with: {
                sender: {
                  with: {
                    roles: {
                      where: {
                        guildId: guildId,
                      },
                      orderBy: {
                        id: 'asc',
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        (val) => val,
      )
    })
    .andThen((channel) => {
      if (!channel) {
        return err('NOT_FOUND')
      }

      const sortedMessages = [...channel.messages].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      )

      return ok({
        messages: sortedMessages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt,
          sender: {
            id: m.sender.id,
            name: m.sender.name,
            displayName: m.sender.displayName,
            avatarUrl: m.sender.avatarUrl
              ? `${storagePublicEndpoint}/${m.sender.avatarUrl}`
              : null,
            roles: (m.sender.roles ?? []).map((role) => ({
              id: role.id,
              name: role.name,
              color: role.color,
            })),
          },
        })),
        channel: {
          id: channel.id,
          name: channel.name,
        },
        user: { id: user.id, name: user.name },
      })
    })
    .match(
      (val) => val,
      (e) => {
        if (e === 'FORBIDDEN') {
          throw new Response('Forbidden', { status: 403 })
        }
        throw new Response('Channel not found', { status: 404 })
      },
    )

  const locale = resolveLocale(request.headers.get('accept-language'))

  return { ...result, locale, loggedInUser: user }
}
