import { showIntro, showOutro, showSummary } from './cli'
import {
  assignMemberships,
  createChannels,
  createDMChannels,
  createFriendships,
  createGuilds,
  createMessages,
  createUsers,
  resetDatabase,
} from './steps'
import type { SeedContext } from './types'

// ============================================================================
// Main Seed Logic
// ============================================================================

showIntro()

const startTime = Date.now()

// Initialize context
const ctx: SeedContext = {
  hashedPassword: '',
  userCounts: {
    loneWolf: 0,
    minimalist: 0,
    beginner: 0,
    average: 0,
    gamer: 0,
    heavyUser: 0,
  },
  users: [],
  allUserIds: [],
  guilds: [],
  friendGuilds: [],
  mediumGuilds: [],
  largeGuilds: [],
  uniqueMemberships: [],
  guildChannelData: [],
  friendshipInsertData: [],
  insertedDMChannels: [],
  totalMessages: 0,
}

// Execute seed steps
await resetDatabase()
await createUsers(ctx)
await createGuilds(ctx)
await assignMemberships(ctx)
await createChannels(ctx)
await createFriendships(ctx)
await createDMChannels(ctx)
await createMessages(ctx)

// Show summary
const elapsed = Date.now() - startTime
showSummary(ctx, elapsed)
showOutro()
