import { defineRelations } from 'drizzle-orm'
import * as p from 'drizzle-orm/pg-core'

export const users = p.pgTable('users', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: p.varchar({ length: 255 }).notNull().unique(),
  email: p.varchar({ length: 255 }).notNull().unique(),
  password: p.varchar({ length: 255 }).notNull(),
})

export const channels = p.pgTable('channels', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: p.text(),
})

export const usersToChannels = p.pgTable(
  'user_channels',
  {
    userId: p.integer('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    channelId: p.integer('channel_id').references(() => channels.id, {
      onDelete: 'cascade',
    }),
  },
  (t) => [p.primaryKey({ columns: [t.userId, t.channelId] })],
)

export const relations = defineRelations(
  { users, channels, usersToChannels },
  (r) => ({
    users: {
      channels: r.many.channels({
        from: r.users.id.through(r.usersToChannels.userId),
        to: r.channels.id.through(r.usersToChannels.channelId),
      }),
    },
    channels: {
      participants: r.many.users(),
    },
  }),
)
