import { defineRelations } from 'drizzle-orm'
import * as p from 'drizzle-orm/pg-core'

export const users = p.pgTable('users', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: p.varchar({ length: 255 }).notNull().unique(),
  displayName: p.varchar('display_name', { length: 255 }),
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

export const messages = p.pgTable('messages', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  content: p.text().notNull(),
  createdAt: p.timestamp('created_at').defaultNow().notNull(),
  channelId: p
    .integer('channel_id')
    .references(() => channels.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  senderId: p
    .integer('sender_id')
    .references(() => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
})

export const relations = defineRelations(
  { users, channels, usersToChannels, messages },
  (r) => ({
    users: {
      channels: r.many.channels({
        from: r.users.id.through(r.usersToChannels.userId),
        to: r.channels.id.through(r.usersToChannels.channelId),
      }),
    },
    channels: {
      participants: r.many.users(),
      messages: r.many.messages(),
    },
    messages: {
      sender: r.one.users({
        from: r.messages.senderId,
        to: r.users.id,
        optional: false,
      }),
      channel: r.one.channels({
        from: r.messages.channelId,
        to: r.channels.id,
        optional: false,
      }),
    },
  }),
)
