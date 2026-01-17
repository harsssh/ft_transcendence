import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext } from '../types'
import { at, randomElement, randomInt } from '../utils'

export async function createMessages(ctx: SeedContext): Promise<void> {
  p.log.step('Creating messages...')

  // 全チャンネルIDを収集
  const allChannelIds: number[] = [
    ...ctx.guilds.flatMap((s) => s.channelIds),
    ...ctx.insertedDMChannels.map((dm) => dm.id),
  ]

  // チャンネルごとのメンバーマップを作成
  const channelMembers: Map<number, number[]> = new Map()

  // ギルドチャンネルのメンバー
  for (const guild of ctx.guilds) {
    for (const channelId of guild.channelIds) {
      channelMembers.set(channelId, guild.memberIds)
    }
  }

  // DMチャンネルのメンバー
  for (const dm of ctx.insertedDMChannels) {
    channelMembers.set(dm.id, [dm.user1, dm.user2])
  }

  ctx.totalMessages = 0

  // 各チャンネルにメッセージを生成
  const messageProgress = createProgressBar({
    total: allChannelIds.length,
    label: options.dryRun
      ? 'Processing channels (dry run)'
      : 'Processing channels',
  })

  for (
    let channelIndex = 0;
    channelIndex < allChannelIds.length;
    channelIndex++
  ) {
    const channelId = at(allChannelIds, channelIndex)
    const members = channelMembers.get(channelId) || []

    if (members.length === 0) {
      messageProgress.increment()
      continue
    }

    const numMessages = randomInt(
      CONFIG.messages.minPerChannel,
      CONFIG.messages.maxPerChannel,
    )

    if (numMessages === 0) {
      messageProgress.increment()
      continue
    }

    if (!options.dryRun) {
      const messageData: {
        content: string
        channelId: number
        senderId: number
      }[] = []

      for (let i = 0; i < numMessages; i++) {
        messageData.push({
          content: randomElement(CONFIG.messageTemplates),
          channelId,
          senderId: randomElement(members),
        })
      }

      // バッチ挿入
      for (let i = 0; i < messageData.length; i += CONFIG.batchSize.messages) {
        const batch = messageData.slice(i, i + CONFIG.batchSize.messages)
        await db.insert(schema.messages).values(batch)
      }
    }

    ctx.totalMessages += numMessages
    messageProgress.increment()
  }
  messageProgress.finish()

  p.log.success(
    `Messages created: ${pc.bold(ctx.totalMessages.toLocaleString())}`,
  )
}
