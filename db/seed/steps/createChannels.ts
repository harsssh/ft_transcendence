import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext } from '../types'
import { randomInt } from '../utils'

export async function createChannels(ctx: SeedContext): Promise<void> {
  p.log.step('Creating guild channels...')

  ctx.guildChannelData = []

  for (const guild of ctx.guilds) {
    const channelConfig = CONFIG.channelsPerGuild[guild.type]
    const numChannels = randomInt(channelConfig.min, channelConfig.max)

    for (let i = 0; i < numChannels; i++) {
      ctx.guildChannelData.push({
        name: `channel_${i + 1}`,
        guildId: guild.id,
      })
    }
  }

  const channelProgress = createProgressBar({
    total: ctx.guildChannelData.length,
    label: options.dryRun ? 'Channels (dry run)' : 'Channels',
  })

  if (options.dryRun) {
    // Dry run: シミュレートしたIDを生成してギルドに紐付け
    let channelId = 1
    for (const channelData of ctx.guildChannelData) {
      const guild = ctx.guilds.find((s) => s.id === channelData.guildId)
      if (guild) {
        guild.channelIds.push(channelId)
      }
      channelId++
    }
    channelProgress.update(ctx.guildChannelData.length)
  } else {
    for (
      let i = 0;
      i < ctx.guildChannelData.length;
      i += CONFIG.batchSize.channels
    ) {
      const batch = ctx.guildChannelData.slice(i, i + CONFIG.batchSize.channels)
      const result = await db
        .insert(schema.channels)
        .values(batch)
        .returning({ id: schema.channels.id, guildId: schema.channels.guildId })

      // ギルドにチャンネルIDを紐付け
      for (const channel of result) {
        const guild = ctx.guilds.find((s) => s.id === channel.guildId)
        if (guild) {
          guild.channelIds.push(channel.id)
        }
      }

      channelProgress.update(
        Math.min(i + CONFIG.batchSize.channels, ctx.guildChannelData.length),
      )
    }
  }
  channelProgress.finish()

  p.log.success(
    `Guild channels created: ${pc.bold(ctx.guildChannelData.length.toLocaleString())}`,
  )
}
