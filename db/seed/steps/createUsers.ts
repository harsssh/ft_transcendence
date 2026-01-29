import { db } from '../../../app/contexts/db'
import { hashPassword } from '../../../app/routes/_auth+/_shared/password.server'
import * as schema from '../../schema'
import { createProgressBar, p, pc, showUserDistribution } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext, UserType } from '../types'
import { at, generateUniqueNames, shuffleArray } from '../utils'

export async function createUsers(ctx: SeedContext): Promise<void> {
  // パスワードをハッシュ化
  ctx.hashedPassword = hashPassword(CONFIG.defaultPassword)

  // ユーザー数の計算
  ctx.userCounts = {
    loneWolf: Math.floor(CONFIG.totalUsers * CONFIG.userTypeRatios.loneWolf),
    minimalist: Math.floor(
      CONFIG.totalUsers * CONFIG.userTypeRatios.minimalist,
    ),
    beginner: Math.floor(CONFIG.totalUsers * CONFIG.userTypeRatios.beginner),
    average: Math.floor(CONFIG.totalUsers * CONFIG.userTypeRatios.average),
    gamer: Math.floor(CONFIG.totalUsers * CONFIG.userTypeRatios.gamer),
    heavyUser: Math.floor(CONFIG.totalUsers * CONFIG.userTypeRatios.heavyUser),
  }

  // 端数を凡人に追加
  const totalCalculated = Object.values(ctx.userCounts).reduce(
    (a, b) => a + b,
    0,
  )
  ctx.userCounts.average += CONFIG.totalUsers - totalCalculated

  showUserDistribution(ctx.userCounts, CONFIG.totalUsers)

  // ユーザーを生成
  p.log.step('Creating users...')
  const userNames = generateUniqueNames('user', CONFIG.totalUsers)
  const userEmails = userNames.map((name) => `${name}@example.com`)

  const userInsertData = userNames.map((name, i) => ({
    name,
    email: at(userEmails, i),
    password: ctx.hashedPassword,
    displayName: `User ${i + 1}`,
  }))

  const insertedUsers: { id: number }[] = []
  const userProgress = createProgressBar({
    total: userInsertData.length,
    label: options.dryRun ? 'Users (dry run)' : 'Users',
  })

  if (options.dryRun) {
    // Dry run: シミュレートしたIDを生成
    for (let i = 0; i < userInsertData.length; i++) {
      insertedUsers.push({ id: i + 1 })
    }
    userProgress.update(userInsertData.length)
  } else {
    for (let i = 0; i < userInsertData.length; i += CONFIG.batchSize.users) {
      const batch = userInsertData.slice(i, i + CONFIG.batchSize.users)
      const result = await db
        .insert(schema.users)
        .values(batch)
        .returning({ id: schema.users.id })
      insertedUsers.push(...result)
      userProgress.update(
        Math.min(i + CONFIG.batchSize.users, userInsertData.length),
      )
    }
  }
  userProgress.finish()

  // ユーザーにタイプを割り当て
  ctx.allUserIds = insertedUsers.map((u) => u.id)
  const shuffledUserIds = shuffleArray(ctx.allUserIds)

  let userIndex = 0
  ctx.users = []

  for (const [type, count] of Object.entries(ctx.userCounts) as [
    UserType,
    number,
  ][]) {
    for (let i = 0; i < count; i++) {
      ctx.users.push({
        id: at(shuffledUserIds, userIndex),
        type,
        assignedFriendGuilds: [],
        assignedMediumGuilds: [],
        assignedLargeGuilds: [],
      })
      userIndex++
    }
  }

  p.log.success(`Users created: ${pc.bold(ctx.users.length.toLocaleString())}`)
}
