import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext } from '../types'
import { randomElement, randomInt } from '../utils'

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

  // 全メッセージを先に生成
  p.log.step('Generating message data...')
  const allMessages: {
    content: string
    channelId: number
    senderId: number
  }[] = []

  for (const channelId of allChannelIds) {
    const members = channelMembers.get(channelId) || []
    if (members.length === 0) continue
    const numMessages = randomInt(
      CONFIG.messages.minPerChannel,
      CONFIG.messages.maxPerChannel,
    )

    for (let i = 0; i < numMessages; i++) {
      allMessages.push({
        content: randomElement(CONFIG.messageTemplates),
        channelId,
        senderId: randomElement(members),
      })
    }
  }

  ctx.totalMessages = allMessages.length

  if (options.dryRun) {
    p.log.success(
      `Messages generated (dry run): ${pc.bold(ctx.totalMessages.toLocaleString())}`,
    )
    return
  }

  // バッチ挿入
  const messageProgress = createProgressBar({
    total: allMessages.length,
    label: 'Messages',
  })

  const BATCH_SIZE = CONFIG.batchSize.messages
  const CONCURRENT_BATCHES = 10 // 同時に実行するバッチ数

  for (
    let i = 0;
    i < allMessages.length;
    i += BATCH_SIZE * CONCURRENT_BATCHES
  ) {
    const promises: Promise<void>[] = []

    for (let j = 0; j < CONCURRENT_BATCHES; j++) {
      const start = i + j * BATCH_SIZE
      if (start >= allMessages.length) break

      const batch = allMessages.slice(start, start + BATCH_SIZE)
      if (batch.length > 0) {
        promises.push(
          db
            .insert(schema.messages)
            .values(batch)
            .then(() => {}),
        )
      }
    }

    await Promise.all(promises)
    messageProgress.update(
      Math.min(i + BATCH_SIZE * CONCURRENT_BATCHES, allMessages.length),
    )
  }
  messageProgress.finish()

  p.log.success(
    `Messages created: ${pc.bold(ctx.totalMessages.toLocaleString())}`,
  )
}
