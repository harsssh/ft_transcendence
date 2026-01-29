import * as R from 'remeda'
import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext } from '../types'
import { at, pickRandom, randomInt } from '../utils'

export async function assignMemberships(ctx: SeedContext): Promise<void> {
  const assignSpinner = p.spinner()
  assignSpinner.start('Assigning users to guilds...')

  // 各ギルドタイプのプール（ラウンドロビン用）
  let friendGuildIndex = 0
  let mediumGuildIndex = 0
  let largeGuildIndex = 0

  for (const user of ctx.users) {
    const typeConfig = CONFIG.userTypes[user.type]

    // 友達ギルドに割り当て
    for (let i = 0; i < typeConfig.friendGuilds; i++) {
      if (ctx.friendGuilds.length > 0) {
        const guild = at(
          ctx.friendGuilds,
          friendGuildIndex % ctx.friendGuilds.length,
        )
        user.assignedFriendGuilds.push(guild.id)
        guild.memberIds.push(user.id)
        friendGuildIndex++
      }
    }

    // 中規模ギルドに割り当て
    for (let i = 0; i < typeConfig.mediumGuilds; i++) {
      if (ctx.mediumGuilds.length > 0) {
        const guild = at(
          ctx.mediumGuilds,
          mediumGuildIndex % ctx.mediumGuilds.length,
        )
        user.assignedMediumGuilds.push(guild.id)
        guild.memberIds.push(user.id)
        mediumGuildIndex++
      }
    }

    // 大規模ギルドに割り当て
    for (let i = 0; i < typeConfig.largeGuilds; i++) {
      if (ctx.largeGuilds.length > 0) {
        const guild = at(
          ctx.largeGuilds,
          largeGuildIndex % ctx.largeGuilds.length,
        )
        user.assignedLargeGuilds.push(guild.id)
        guild.memberIds.push(user.id)
        largeGuildIndex++
      }
    }
  }

  // ギルドメンバー数の調整（最小・最大を満たすように）
  for (const guild of ctx.guilds) {
    const config = CONFIG.guildTypes[guild.type]
    const targetSize = randomInt(config.minMembers, config.maxMembers)

    // 足りない場合は追加
    if (guild.memberIds.length < targetSize) {
      const availableUsers = ctx.allUserIds.filter(
        (id) => !guild.memberIds.includes(id),
      )
      const additionalMembers = pickRandom(
        availableUsers,
        targetSize - guild.memberIds.length,
      )
      guild.memberIds.push(...additionalMembers)
    }

    // 多すぎる場合は削減
    if (guild.memberIds.length > config.maxMembers) {
      guild.memberIds = guild.memberIds.slice(0, config.maxMembers)
    }
  }

  assignSpinner.stop(`${pc.green('✓')} Users assigned to guilds`)

  // guild_membersを挿入
  p.log.step('Creating guild memberships...')

  const allMemberships: { userId: number; guildId: number }[] = []
  for (const guild of ctx.guilds) {
    for (const userId of guild.memberIds) {
      allMemberships.push({ userId, guildId: guild.id })
    }
  }

  // 重複を除去
  ctx.uniqueMemberships = R.uniqueBy(
    allMemberships,
    (m) => `${m.userId}-${m.guildId}`,
  )

  const membershipProgress = createProgressBar({
    total: ctx.uniqueMemberships.length,
    label: options.dryRun ? 'Memberships (dry run)' : 'Memberships',
  })

  if (options.dryRun) {
    // Dry run: DB挿入をスキップ
    membershipProgress.update(ctx.uniqueMemberships.length)
  } else {
    for (
      let i = 0;
      i < ctx.uniqueMemberships.length;
      i += CONFIG.batchSize.guildMembers
    ) {
      const batch = ctx.uniqueMemberships.slice(
        i,
        i + CONFIG.batchSize.guildMembers,
      )
      await db.insert(schema.guildMembers).values(batch).onConflictDoNothing()
      membershipProgress.update(
        Math.min(
          i + CONFIG.batchSize.guildMembers,
          ctx.uniqueMemberships.length,
        ),
      )
    }
  }
  membershipProgress.finish()

  p.log.success(
    `Guild memberships created: ${pc.bold(ctx.uniqueMemberships.length.toLocaleString())}`,
  )
}
