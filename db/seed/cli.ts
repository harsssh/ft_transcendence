import * as p from '@clack/prompts'
import cliProgress from 'cli-progress'
import pc from 'picocolors'
import { CONFIG } from './config'
import { options } from './options'
import type { SeedContext } from './types'
import { formatDuration } from './utils'

// ============================================================================
// CLI Progress Utilities
// ============================================================================

interface ProgressBarOptions {
  total: number
  label: string
}

export function createProgressBar({ total, label }: ProgressBarOptions) {
  const bar = new cliProgress.SingleBar(
    {
      format: `  ${pc.bold('{label}')} ${pc.green('{bar}')} ${pc.cyan('{percentage}%')} ${pc.dim('{value}/{total}')} ${pc.dim('[{duration}s<{eta}s]')}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: false,
      forceRedraw: true,
    },
    cliProgress.Presets.shades_classic,
  )

  bar.start(total, 0, { label })

  return {
    update: (value: number) => {
      bar.update(value, { label })
    },
    increment: (amount = 1) => {
      bar.increment(amount, { label })
    },
    finish: () => {
      bar.update(total, { label })
      bar.stop()
    },
  }
}

export function showIntro() {
  console.clear()
  const title = options.dryRun
    ? pc.bgYellow(pc.black(' 🌱 Database Seed (DRY RUN) '))
    : pc.bgCyan(pc.black(' 🌱 Database Seed '))
  p.intro(title)

  if (options.dryRun) {
    p.log.warn(
      pc.yellow('Dry run mode: No data will be written to the database'),
    )
  }
}

export function showUserDistribution(
  userCounts: Record<string, number>,
  totalUsers: number,
) {
  p.log.info(pc.bold('User distribution'))
  console.log(pc.dim('  ┌─────────────────────────────────────────┐'))
  for (const [type, count] of Object.entries(userCounts)) {
    const bar = pc.green('█'.repeat(Math.round((count / totalUsers) * 20)))
    const percent = ((count / totalUsers) * 100).toFixed(1)
    console.log(
      pc.dim('  │') +
        ` ${type.padEnd(12)} ${bar.padEnd(20)} ${pc.cyan(`${percent}%`)} ${pc.dim(`(${count.toLocaleString()})`)}`,
    )
  }
  console.log(pc.dim('  └─────────────────────────────────────────┘'))
}

export function showGuildCounts(
  numFriendGuilds: number,
  numMediumGuilds: number,
  numLargeGuilds: number,
) {
  p.log.info(pc.bold('Guild counts to create'))
  console.log(pc.dim('  ┌────────────────────────────────────┐'))
  console.log(
    pc.dim('  │') +
      ` ${pc.yellow('friend')}  ${pc.bold(numFriendGuilds.toLocaleString().padStart(8))} guilds`,
  )
  console.log(
    pc.dim('  │') +
      ` ${pc.blue('medium')}  ${pc.bold(numMediumGuilds.toLocaleString().padStart(8))} guilds`,
  )
  console.log(
    pc.dim('  │') +
      ` ${pc.magenta('large')}   ${pc.bold(numLargeGuilds.toLocaleString().padStart(8))} guilds`,
  )
  console.log(pc.dim('  └────────────────────────────────────┘'))
}

export function showSummary(ctx: SeedContext, elapsed: number) {
  console.log()
  const modeLabel = options.dryRun ? pc.yellow(' (DRY RUN)') : ''
  p.note(
    [
      pc.bold('📊 Seed Summary') + modeLabel,
      '',
      pc.dim('─'.repeat(45)),
      '',
      `${pc.cyan('Users')}         ${pc.bold(CONFIG.totalUsers.toLocaleString())}`,
      `  ${pc.dim('├─')} Lone wolves  ${pc.yellow(ctx.userCounts.loneWolf.toLocaleString().padStart(8))} ${pc.dim(`(${CONFIG.userTypeRatios.loneWolf * 100}%)`)}`,
      `  ${pc.dim('├─')} Minimalists  ${pc.yellow(ctx.userCounts.minimalist.toLocaleString().padStart(8))} ${pc.dim(`(${CONFIG.userTypeRatios.minimalist * 100}%)`)}`,
      `  ${pc.dim('├─')} Beginners    ${pc.yellow(ctx.userCounts.beginner.toLocaleString().padStart(8))} ${pc.dim(`(${CONFIG.userTypeRatios.beginner * 100}%)`)}`,
      `  ${pc.dim('├─')} Average      ${pc.yellow(ctx.userCounts.average.toLocaleString().padStart(8))} ${pc.dim(`(${CONFIG.userTypeRatios.average * 100}%)`)}`,
      `  ${pc.dim('├─')} Gamers       ${pc.yellow(ctx.userCounts.gamer.toLocaleString().padStart(8))} ${pc.dim(`(${CONFIG.userTypeRatios.gamer * 100}%)`)}`,
      `  ${pc.dim('└─')} Heavy users  ${pc.yellow(ctx.userCounts.heavyUser.toLocaleString().padStart(8))} ${pc.dim(`(${CONFIG.userTypeRatios.heavyUser * 100}%)`)}`,
      '',
      `${pc.cyan('Guilds')}        ${pc.bold(ctx.guilds.length.toLocaleString())}`,
      `  ${pc.dim('├─')} Friend       ${pc.blue(ctx.friendGuilds.length.toLocaleString().padStart(8))}`,
      `  ${pc.dim('├─')} Medium       ${pc.blue(ctx.mediumGuilds.length.toLocaleString().padStart(8))}`,
      `  ${pc.dim('└─')} Large        ${pc.blue(ctx.largeGuilds.length.toLocaleString().padStart(8))}`,
      '',
      `${pc.cyan('Memberships')}   ${pc.bold(ctx.uniqueMemberships.length.toLocaleString())}`,
      `${pc.cyan('Channels')}      ${pc.bold(ctx.guildChannelData.length.toLocaleString())}`,
      `${pc.cyan('Friendships')}   ${pc.bold(ctx.friendshipInsertData.length.toLocaleString())}`,
      `${pc.cyan('DM Channels')}   ${pc.bold(ctx.insertedDMChannels.length.toLocaleString())}`,
      `${pc.cyan('Messages')}      ${pc.bold(ctx.totalMessages.toLocaleString())}`,
      '',
      pc.dim('─'.repeat(45)),
      `${pc.dim('Duration:')} ${pc.green(formatDuration(elapsed))}`,
    ].join('\n'),
    'Complete',
  )
}

export function showOutro() {
  const message = options.dryRun
    ? pc.yellow('🔍 Dry run complete! No data was written.')
    : pc.green('🎉 Seeding complete!')
  p.outro(message)
}

export { p, pc }
