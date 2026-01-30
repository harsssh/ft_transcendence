import { desc, eq, or } from 'drizzle-orm'
import { db } from '../../app/contexts/db'
import { message3DAssets, messages } from '../../db/schema'
import { getMeshyApiKey } from '../../server/utils/env'
import { MeshyProvider } from '../provider/meshy'
import { resume3DGeneration } from './processor'

export async function recover3DJobs() {
  console.log('[3D-Recovery] Starting recovery for pending/failed jobs...')

  const apiKey = getMeshyApiKey()
  if (!apiKey) {
    console.warn('[3D-Recovery] No API Key found, skipping recovery.')
    return
  }

  const provider = new MeshyProvider(apiKey)

  // Join with messages to get channelId
  const stuckJobs = await db
    .select({
      asset: message3DAssets,
      message: messages,
    })
    .from(message3DAssets)
    .innerJoin(messages, eq(message3DAssets.messageId, messages.id))
    .where(
      or(
        eq(message3DAssets.status, 'generating'),
        eq(message3DAssets.status, 'queued'),
        eq(message3DAssets.status, 'failed'),
      ),
    )
    .orderBy(desc(message3DAssets.createdAt))
    .limit(20)

  console.log(
    `[3D-Recovery] Found ${stuckJobs.length} potential jobs to recover.`,
  )

  for (const { asset, message } of stuckJobs) {
    if (!asset.externalId) continue

    try {
      const statusRes = await provider.getTaskStatus(asset.externalId)
      console.log(
        `[3D-Recovery] Job ${asset.id} (${asset.externalId}): ${statusRes.status}`,
      )

      // 1. Success
      if (statusRes.status === 'SUCCEEDED') {
        // If we have a modelUrl AND existing status was generating/queued, it was likely a Refine job
        // (because Refine preserves the original modelUrl while generating)
        // Or if it was initial, modelUrl is usually null (unless partial update happened)
        // We use presence of modelUrl to imply 'refined' target status
        const isRefine = !!asset.modelUrl
        const successStatus = isRefine ? 'refined' : 'ready'

        console.log(
          `[3D-Recovery] Job ${asset.id} SUCCEEDED. Setting status to '${successStatus}'.`,
        )
        await db
          .update(message3DAssets)
          .set({
            status: successStatus,
            modelUrl: statusRes.modelUrl,
            updatedAt: new Date(),
          })
          .where(eq(message3DAssets.id, asset.id))

        // 2. Failed
      } else if (
        statusRes.status === 'FAILED' ||
        statusRes.status === 'EXPIRED'
      ) {
        if (asset.status !== 'failed') {
          console.log(`[3D-Recovery] Job ${asset.id} FAILED. Updating DB.`)
          await db
            .update(message3DAssets)
            .set({
              status: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(message3DAssets.id, asset.id))
        }

        // 3. Still Pending/Running
      } else if (
        statusRes.status === 'PENDING' ||
        statusRes.status === 'IN_PROGRESS'
      ) {
        console.log(
          `[3D-Recovery] Job ${asset.id} still running (Meshy Status: ${statusRes.status}). Resuming polling.`,
        )

        // Mock broadcaster - logs to console since we don't have active WS connection for this user context
        const broadcastUpdate = (
          _cId: number,
          _mId: number,
          _update: { status: string; modelUrl: string | null },
        ) => {
          console.log(
            `[3D-Recovery-Poll] Update for ${asset.id}: ${_update.status}`,
          )
        }

        const isRefine = !!asset.modelUrl
        const successStatus = isRefine ? 'refined' : 'ready'

        // Resume polling (this will run in background)
        resume3DGeneration(
          db,
          message.channelId,
          message.id,
          asset.id,
          asset.prompt,
          broadcastUpdate,
          undefined,
          successStatus,
        ).catch((e) =>
          console.error(`[3D-Recovery] Error resuming job ${asset.id}:`, e),
        )
      }
    } catch (e) {
      console.error(`[3D-Recovery] Error checking job ${asset.id}:`, e)
    }
  }
  console.log('[3D-Recovery] Recovery complete.')
}
