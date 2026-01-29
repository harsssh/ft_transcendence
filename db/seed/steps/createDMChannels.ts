import * as R from 'remeda'
import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext } from '../types'
import { at } from '../utils'

export async function createDMChannels(ctx: SeedContext): Promise<void> {
  p.log.step('Creating DM channels...')

  const dmChannelPairs: { user1: number; user2: number }[] = []

  for (const user of ctx.users) {
    const typeConfig = CONFIG.userTypes[user.type]

    // ミニマリスト・初心者: フレンドとDM
    if (typeConfig.hasDMs) {
      const userFriendships = ctx.friendshipInsertData.filter(
        (f) => f.userId === user.id || f.friendId === user.id,
      )
      for (const f of userFriendships) {
        const friendId = f.userId === user.id ? f.friendId : f.userId
        dmChannelPairs.push({
          user1: Math.min(user.id, friendId),
          user2: Math.max(user.id, friendId),
        })
      }
    }
  }

  // 重複を除去
  const uniqueDMPairs = R.uniqueBy(
    dmChannelPairs,
    (p) => `${p.user1}-${p.user2}`,
  )

  // DMチャンネルを作成（name=null, guildId=null）
  const dmChannelInsertData = uniqueDMPairs.map(() => ({
    name: null,
    guildId: null,
  }))

  ctx.insertedDMChannels = []

  const dmProgress = createProgressBar({
    total: dmChannelInsertData.length,
    label: options.dryRun ? 'DM Channels (dry run)' : 'DM Channels',
  })

  if (options.dryRun) {
    // Dry run: シミュレートしたIDを生成
    uniqueDMPairs.forEach((pair, i) => {
      ctx.insertedDMChannels.push({
        id: i + 1,
        user1: pair.user1,
        user2: pair.user2,
      })
    })
    dmProgress.update(dmChannelInsertData.length)
  } else {
    for (
      let i = 0;
      i < dmChannelInsertData.length;
      i += CONFIG.batchSize.channels
    ) {
      const batch = dmChannelInsertData.slice(i, i + CONFIG.batchSize.channels)
      const result = await db
        .insert(schema.channels)
        .values(batch)
        .returning({ id: schema.channels.id })

      result.forEach((r, j) => {
        const pair = at(uniqueDMPairs, i + j)
        ctx.insertedDMChannels.push({
          id: r.id,
          user1: pair.user1,
          user2: pair.user2,
        })
      })

      dmProgress.update(
        Math.min(i + CONFIG.batchSize.channels, dmChannelInsertData.length),
      )
    }
  }
  dmProgress.finish()

  // DMチャンネルにユーザーを紐付け
  const userChannelData: { userId: number; channelId: number }[] = []
  for (const dm of ctx.insertedDMChannels) {
    userChannelData.push({ userId: dm.user1, channelId: dm.id })
    userChannelData.push({ userId: dm.user2, channelId: dm.id })
  }

  const userChannelProgress = createProgressBar({
    total: userChannelData.length,
    label: options.dryRun
      ? 'User-Channel Links (dry run)'
      : 'User-Channel Links',
  })

  if (options.dryRun) {
    // Dry run: DB挿入をスキップ
    userChannelProgress.update(userChannelData.length)
  } else {
    for (
      let i = 0;
      i < userChannelData.length;
      i += CONFIG.batchSize.usersToChannels
    ) {
      const batch = userChannelData.slice(
        i,
        i + CONFIG.batchSize.usersToChannels,
      )
      await db
        .insert(schema.usersToChannels)
        .values(batch)
        .onConflictDoNothing()
      userChannelProgress.update(
        Math.min(i + CONFIG.batchSize.usersToChannels, userChannelData.length),
      )
    }
  }
  userChannelProgress.finish()

  p.log.success(
    `DM channels created: ${pc.bold(ctx.insertedDMChannels.length.toLocaleString())}`,
  )
}
