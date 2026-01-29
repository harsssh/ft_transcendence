import * as R from 'remeda'
import { db } from '../../../app/contexts/db'
import * as schema from '../../schema'
import { createProgressBar, p, pc } from '../cli'
import { CONFIG } from '../config'
import { options } from '../options'
import type { SeedContext } from '../types'
import { pickRandom } from '../utils'

export async function createFriendships(ctx: SeedContext): Promise<void> {
  p.log.step('Creating friendships...')

  const friendships: { userId: number; friendId: number }[] = []

  for (const user of ctx.users) {
    const typeConfig = CONFIG.userTypes[user.type]

    if (typeConfig.friendCount === 0) {
      continue
    }

    // 初心者: 友達ギルドメンバー全員とフレンド
    if (typeConfig.friendCount === -1) {
      for (const guildId of user.assignedFriendGuilds) {
        const guild = ctx.guilds.find((s) => s.id === guildId)
        if (guild) {
          for (const memberId of guild.memberIds) {
            if (memberId !== user.id) {
              friendships.push({ userId: user.id, friendId: memberId })
            }
          }
        }
      }
    } else {
      // その他: ランダムにフレンドを選択
      const potentialFriends = ctx.allUserIds.filter((id) => id !== user.id)
      const selectedFriends = pickRandom(
        potentialFriends,
        typeConfig.friendCount,
      )
      for (const friendId of selectedFriends) {
        friendships.push({ userId: user.id, friendId })
      }
    }
  }

  // 重複を除去（双方向のフレンドシップを1つに）
  const uniqueFriendships = R.uniqueBy(friendships, (f) =>
    [Math.min(f.userId, f.friendId), Math.max(f.userId, f.friendId)].join('-'),
  )

  ctx.friendshipInsertData = uniqueFriendships.map((f) => ({
    userId: f.userId,
    friendId: f.friendId,
    status: 'accepted' as const,
  }))

  const friendshipProgress = createProgressBar({
    total: ctx.friendshipInsertData.length,
    label: options.dryRun ? 'Friendships (dry run)' : 'Friendships',
  })

  if (options.dryRun) {
    // Dry run: DB挿入をスキップ
    friendshipProgress.update(ctx.friendshipInsertData.length)
  } else {
    for (
      let i = 0;
      i < ctx.friendshipInsertData.length;
      i += CONFIG.batchSize.friendships
    ) {
      const batch = ctx.friendshipInsertData.slice(
        i,
        i + CONFIG.batchSize.friendships,
      )
      await db.insert(schema.friendships).values(batch).onConflictDoNothing()
      friendshipProgress.update(
        Math.min(
          i + CONFIG.batchSize.friendships,
          ctx.friendshipInsertData.length,
        ),
      )
    }
  }
  friendshipProgress.finish()

  p.log.success(
    `Friendships created: ${pc.bold(ctx.friendshipInsertData.length.toLocaleString())}`,
  )
}
