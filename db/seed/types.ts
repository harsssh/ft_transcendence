import type { CONFIG } from './config'

export type UserType = keyof typeof CONFIG.userTypes
export type GuildType = 'friend' | 'medium' | 'large'

export interface UserData {
  id: number
  type: UserType
  assignedFriendGuilds: number[]
  assignedMediumGuilds: number[]
  assignedLargeGuilds: number[]
}

export interface GuildData {
  id: number
  type: GuildType
  memberIds: number[]
  channelIds: number[]
}

export interface DMChannel {
  id: number
  user1: number
  user2: number
}

export interface SeedContext {
  hashedPassword: string
  userCounts: Record<UserType, number>
  users: UserData[]
  allUserIds: number[]
  guilds: GuildData[]
  friendGuilds: GuildData[]
  mediumGuilds: GuildData[]
  largeGuilds: GuildData[]
  uniqueMemberships: { userId: number; guildId: number }[]
  guildChannelData: { name: string; guildId: number }[]
  friendshipInsertData: {
    userId: number
    friendId: number
    status: 'accepted'
  }[]
  insertedDMChannels: DMChannel[]
  totalMessages: number
}
