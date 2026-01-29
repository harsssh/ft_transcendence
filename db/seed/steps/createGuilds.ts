import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc, showGuildCounts } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext, UserType } from '../types'
import { at } from '../utils'

export async function createGuilds(ctx: SeedContext): Promise<void> {
  // 必要なギルド数を計算
  const totalFriendGuildMemberships = Object.entries(ctx.userCounts).reduce(
    (acc, [type, count]) =>
      acc + count * CONFIG.userTypes[type as UserType].friendGuilds,
    0,
  )
  const totalMediumGuildMemberships = Object.entries(ctx.userCounts).reduce(
    (acc, [type, count]) =>
      acc + count * CONFIG.userTypes[type as UserType].mediumGuilds,
    0,
  )
  const totalLargeGuildMemberships = Object.entries(ctx.userCounts).reduce(
    (acc, [type, count]) =>
      acc + count * CONFIG.userTypes[type as UserType].largeGuilds,
    0,
  )

  const avgFriendGuildMembers =
    (CONFIG.guildTypes.friend.minMembers +
      CONFIG.guildTypes.friend.maxMembers) /
    2
  const avgMediumGuildMembers =
    (CONFIG.guildTypes.medium.minMembers +
      CONFIG.guildTypes.medium.maxMembers) /
    2
  const avgLargeGuildMembers =
    (CONFIG.guildTypes.large.minMembers + CONFIG.guildTypes.large.maxMembers) /
    2

  // 各ユーザータイプが必要とするギルド数の最大値を取得
  // ラウンドロビンで割り当てるため、最低でもこの数のギルドが必要
  const maxRequiredFriendGuilds = Math.max(
    ...Object.values(CONFIG.userTypes).map((t) => t.friendGuilds),
  )
  const maxRequiredMediumGuilds = Math.max(
    ...Object.values(CONFIG.userTypes).map((t) => t.mediumGuilds),
  )
  const maxRequiredLargeGuilds = Math.max(
    ...Object.values(CONFIG.userTypes).map((t) => t.largeGuilds),
  )

  // 総メンバーシップから計算したギルド数と、最低必要なギルド数の大きい方を採用
  const numFriendGuilds = Math.max(
    Math.ceil(totalFriendGuildMemberships / avgFriendGuildMembers),
    maxRequiredFriendGuilds,
  )
  const numMediumGuilds = Math.max(
    Math.ceil(totalMediumGuildMemberships / avgMediumGuildMembers),
    maxRequiredMediumGuilds,
  )
  const numLargeGuilds = Math.max(
    Math.ceil(totalLargeGuildMemberships / avgLargeGuildMembers),
    maxRequiredLargeGuilds,
  )

  showGuildCounts(numFriendGuilds, numMediumGuilds, numLargeGuilds)

  // ギルドを生成
  p.log.step('Creating guilds...')

  const guildData: {
    name: string
    ownerId: number
    type: 'friend' | 'medium' | 'large'
  }[] = []

  // 友達ギルド
  for (let i = 0; i < numFriendGuilds; i++) {
    guildData.push({
      name: `FriendGuild_${i + 1}`,
      ownerId: at(ctx.allUserIds, i % ctx.allUserIds.length),
      type: 'friend',
    })
  }

  // 中規模ギルド
  for (let i = 0; i < numMediumGuilds; i++) {
    guildData.push({
      name: `CommunityGuild_${i + 1}`,
      ownerId: at(
        ctx.allUserIds,
        (numFriendGuilds + i) % ctx.allUserIds.length,
      ),
      type: 'medium',
    })
  }

  // 大規模ギルド
  for (let i = 0; i < numLargeGuilds; i++) {
    guildData.push({
      name: `LargeCommunity_${i + 1}`,
      ownerId: at(
        ctx.allUserIds,
        (numFriendGuilds + numMediumGuilds + i) % ctx.allUserIds.length,
      ),
      type: 'large',
    })
  }

  ctx.guilds = []

  const guildProgress = createProgressBar({
    total: guildData.length,
    label: options.dryRun ? 'Guilds (dry run)' : 'Guilds',
  })

  if (options.dryRun) {
    // Dry run: シミュレートしたIDを生成
    guildData.forEach((g, i) => {
      ctx.guilds.push({
        id: i + 1,
        type: g.type,
        memberIds: [],
        channelIds: [],
      })
    })
    guildProgress.update(guildData.length)
  } else {
    for (let i = 0; i < guildData.length; i += CONFIG.batchSize.guilds) {
      const batch = guildData
        .slice(i, i + CONFIG.batchSize.guilds)
        .map((g) => ({
          name: g.name,
          ownerId: g.ownerId,
        }))
      const result = await db
        .insert(schema.guilds)
        .values(batch)
        .returning({ id: schema.guilds.id })

      result.forEach((r, j) => {
        const guildInfo = at(guildData, i + j)
        ctx.guilds.push({
          id: r.id,
          type: guildInfo.type,
          memberIds: [],
          channelIds: [],
        })
      })
      guildProgress.update(
        Math.min(i + CONFIG.batchSize.guilds, guildData.length),
      )
    }
  }
  guildProgress.finish()

  ctx.friendGuilds = ctx.guilds.filter((s) => s.type === 'friend')
  ctx.mediumGuilds = ctx.guilds.filter((s) => s.type === 'medium')
  ctx.largeGuilds = ctx.guilds.filter((s) => s.type === 'large')

  p.log.success(
    `Guilds created: ${pc.bold(ctx.guilds.length.toLocaleString())}`,
  )
}
