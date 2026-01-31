import { eq } from 'drizzle-orm'
import { db } from '../../app/contexts/db'
import { message3DAssets } from '../../db/schema'
import { resume3DGeneration } from '../jobs/processor'
import { MeshyProvider } from '../provider/meshy'

type RefineResult = {
  success: boolean
  status: string
  error?: string
}

export async function processRefineRequest(
  messageId: number,
  channelId: number,
  apiKey: string,
  broadcastUpdate: (
    cId: number,
    mId: number,
    update: { status: string; modelUrl: string | null },
  ) => void,
): Promise<RefineResult> {
  // 1. Get Asset (Using db.select to avoid Drizzle 'decoder' error)
  const [asset] = await db
    .select()
    .from(message3DAssets)
    .where(eq(message3DAssets.messageId, messageId))
    .limit(1)

  if (!asset || !asset.externalId) {
    throw new Error('Asset not found or invalid')
  }

  // 2. Call Meshy API
  const provider = new MeshyProvider(apiKey)
  const refineTaskId = await provider.refineTask(asset.externalId)

  // 3. Update DB
  await db
    .update(message3DAssets)
    .set({
      status: 'generating',
      externalId: refineTaskId,
      updatedAt: new Date(),
    })
    .where(eq(message3DAssets.id, asset.id))

  // 4. Send initial broadcast
  broadcastUpdate(channelId, messageId, {
    status: 'generating',
    modelUrl: asset.modelUrl,
  })

  // 5. Resume Polling
  resume3DGeneration(
    db,
    channelId,
    messageId,
    asset.id,
    asset.prompt,
    broadcastUpdate,
    () => {},
    'refined',
  ).catch((e) => console.error('[Refine] Resume polling error:', e))

  return { success: true, status: 'generating' }
}
