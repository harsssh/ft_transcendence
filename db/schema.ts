import { defineRelations } from 'drizzle-orm'
import * as p from 'drizzle-orm/pg-core'

export const users = p.pgTable('users', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: p.varchar({ length: 255 }).notNull().unique(),
  displayName: p.varchar('display_name', { length: 255 }),
  email: p.varchar({ length: 255 }).notNull().unique(),
  password: p.varchar({ length: 255 }).notNull(),
  avatarUrl: p.text('avatar_url'),
})

export const guilds = p.pgTable('guilds', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: p.varchar({ length: 255 }).notNull(),
  icon: p.text(),
  ownerId: p
    .integer('owner_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: p.timestamp('created_at').defaultNow().notNull(),
})

export const channels = p.pgTable('channels', {
  id: p.integer().primaryKey().generatedAlwaysAsIdentity(),
  name: p.text(),
  guildId: p.integer('guild_id').references(() => guilds.id, {
    onDelete: 'cascade',
  }),
})

export const guildMembers = p.pgTable(
  'guild_members',
  {
    userId: p
      .integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    guildId: p
      .integer('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    joinedAt: p.timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => [
    p.primaryKey({ columns: [t.userId, t.guildId] }),
    p.index('guild_members_guild_id_idx').on(t.guildId),
  ],
)

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

export const friendStatusEnum = p.pgEnum('friend_status', [
  'pending',
  'accepted',
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
  {
    users,
    guilds,
    guildMembers,
    channels,
    usersToChannels,
    messages,
    friendships,
  },
  (r) => ({
    users: {
      guilds: r.many.guilds({
        from: r.users.id.through(r.guildMembers.userId),
        to: r.guilds.id.through(r.guildMembers.guildId),
      }),
      ownedGuilds: r.many.guilds({
        alias: 'owner',
        from: r.users.id,
        to: r.guilds.ownerId,
      }),
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
    guilds: {
      owner: r.one.users({
        from: r.guilds.ownerId,
        to: r.users.id,
        alias: 'owner',
      }),
      members: r.many.users({
        from: r.guilds.id.through(r.guildMembers.guildId),
        to: r.users.id.through(r.guildMembers.userId),
      }),
      channels: r.many.channels({
        from: r.guilds.id,
        to: r.channels.guildId,
      }),
    },
    guildMembers: {
      user: r.one.users({
        from: r.guildMembers.userId,
        to: r.users.id,
      }),
      guild: r.one.guilds({
        from: r.guildMembers.guildId,
        to: r.guilds.id,
      }),
    },
    channels: {
      guild: r.one.guilds({
        from: r.channels.guildId,
        to: r.guilds.id,
      }),
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
