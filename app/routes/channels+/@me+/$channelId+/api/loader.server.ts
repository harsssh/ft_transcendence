import { err, ok, ResultAsync } from 'neverthrow'
import z from 'zod'
import { dbContext } from '../../../../../contexts/db'
import { userContext } from '../../../../../contexts/user'
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
  const user = context.get(userContext)
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const db = context.get(dbContext)
  const { data: channelId, success } = z.coerce
    .number()
    .safeParse(params.channelId)

  if (!success) {
    throw new Response('Bad Request', { status: 400 })
  }

  const result = await ResultAsync.fromPromise(
    db.query.channels.findFirst({
      where: {
        id: channelId,
      },
      with: {
        participants: true,
        messages: {
          with: {
            sender: true,
          },
        },
      },
    }),
    (val) => val,
  )
    .andThen((channel) => {
      if (!channel) {
        return err('NOT_FOUND')
      }

      if (!channel.participants.some((p) => p.id === user.id)) {
        return err('FORBIDDEN')
      }

      const partner = channel.participants.find((p) => p.id !== user.id)
      const sortedMessages = channel.messages.sort(
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
          },
        })),
        partner: partner ? { id: partner.id, name: partner.name } : null,
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

  return { ...result, locale }
}
