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

export const friendStatusEnum = p.pgEnum('friend_status', [
  'pending',
  'accepted',
  'blocked',
])

export const friendships = p.pgTable(
  'friendships',
  {
    userId: p
      .integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    friendId: p
      .integer('friend_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: friendStatusEnum('status').notNull(),
    createdAt: p.timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [p.primaryKey({ columns: [t.userId, t.friendId] })],
)

export const relations = defineRelations(
  { users, channels, usersToChannels, friendships },
  (r) => ({
    users: {
      channels: r.many.channels({
        from: r.users.id.through(r.usersToChannels.userId),
        to: r.channels.id.through(r.usersToChannels.channelId),
      }),
      sentFriendships: r.many.friendships({
        alias: 'friendship_user',
      }),
      receivedFriendships: r.many.friendships({
        alias: 'friendship_friend',
      }),
    },
    channels: {
      participants: r.many.users(),
    },
    friendships: {
      user: r.one.users({
        from: r.friendships.userId,
        to: r.users.id,
        alias: 'friendship_user',
      }),
      friend: r.one.users({
        from: r.friendships.friendId,
        to: r.users.id,
        alias: 'friendship_friend',
      }),
    },
  }),
)
