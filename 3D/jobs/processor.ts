import { eq } from 'drizzle-orm'
import { message3DAssets } from '../../db/schema'
import { MeshyProvider } from '../provider/meshy'

type BroadcastUpdateFn = (
  channelId: number,
  messageId: number,
  asset: { status: string; modelUrl: string | null; precedingTasks?: number },
) => void

// Fallback Mock Logic
async function runMock(
  // biome-ignore lint/suspicious/noExplicitAny: Mock DB type
  db: any,
  channelId: number,
  messageId: number,
  assetId: number,
  broadcastUpdate: BroadcastUpdateFn,
) {
  setTimeout(async () => {
    await db
      .update(message3DAssets)
      .set({ status: 'generating' })
      .where(eq(message3DAssets.id, assetId))
    broadcastUpdate(channelId, messageId, {
      status: 'generating',
      modelUrl: null,
    })

    setTimeout(async () => {
      const mockUrl =
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb'
      await db
        .update(message3DAssets)
        .set({ status: 'ready', modelUrl: mockUrl })
        .where(eq(message3DAssets.id, assetId))
      broadcastUpdate(channelId, messageId, {
        status: 'ready',
        modelUrl: mockUrl,
      })
    }, 5000)
  }, 2000)
}

export async function resume3DGeneration(
  // biome-ignore lint/suspicious/noExplicitAny: DB type mismatch during migration
  db: any,
  channelId: number,
  messageId: number,
  assetId: number,
  prompt: string,
  broadcastUpdate: BroadcastUpdateFn,
  onComplete?: () => void,
  successStatus: string = 'ready',
) {
  const providerName = process.env.TEXT3D_PROVIDER || 'mock'
  let apiKey = process.env.MESHY_API_KEY

  if (providerName === 'meshy' && !apiKey) {
    try {
      // Try reading from Docker secret
      const fs = await import('node:fs')
      // Check if file exists first or just try reading
      if (fs.existsSync('/run/secrets/meshy_api_key')) {
        apiKey = fs.readFileSync('/run/secrets/meshy_api_key', 'utf8').trim()
      }
    } catch (e) {
      console.warn('[3D-Job] Failed to read secret:', e)
    }
  }

  console.log(
    `[3D-Job] Resuming ${providerName} job for asset ${assetId} (message ${messageId}): "${prompt}"`,
  )

  // 1. Check existing state to support Refine/Resume
  // This prevents overwriting a Refine task (already 'generating' with ID) with a new Preview task
  const [currentAsset] = await db
    .select()
    .from(message3DAssets)
    .where(eq(message3DAssets.id, assetId))
    .limit(1)

  let taskId = currentAsset?.externalId

  broadcastUpdate(channelId, messageId, {
    status: currentAsset?.status || 'queued',
    modelUrl: currentAsset?.modelUrl || null,
  })

  // Determine failure behavior
  // If this was a Refine task (successStatus === 'refined') and we have a previous model,
  // we keep 'failed' status but preserve the URL so the UI can show the button.
  const failureStatus = 'failed'
  const failureUrl =
    successStatus === 'refined' && currentAsset?.modelUrl
      ? currentAsset.modelUrl
      : null

  // 2. Select Provider
  if (providerName === 'meshy' && apiKey) {
    const provider = new MeshyProvider(apiKey)
    const MAX_RETRIES = 3
    let retryCount = 0
    let success = false

    while (retryCount < MAX_RETRIES && !success) {
      try {
        // Only create a new task if we don't have a valid running one
        if (!taskId || currentAsset?.status === 'queued') {
          taskId = await provider.createTask(prompt)

          // Update External ID
          await db
            .update(message3DAssets)
            .set({ externalId: taskId, status: 'generating' })
            .where(eq(message3DAssets.id, assetId))

          // If Refine, keep showing the old model while generating
          const initialUrl =
            successStatus === 'refined' && currentAsset?.modelUrl
              ? currentAsset.modelUrl
              : null
          broadcastUpdate(channelId, messageId, {
            status: 'generating',
            modelUrl: initialUrl,
          })
        } else {
          console.log(`[3D-Job] Continuing existing task ${taskId}`)
        }

        if (!taskId) throw new Error('Task ID missing')

        // 3D Polling Loop
        let attempts = 0
        const maxAttempts = 120 // 5s * 120 = 10 minutes extended

        await new Promise<void>((resolve) => {
          const pollInterval = setInterval(async () => {
            attempts++
            if (attempts > maxAttempts) {
              clearInterval(pollInterval)
              console.error(`[3D-Job] Timeout polling ${taskId}`)

              // Timeout behavior:
              // If we have a modelUrl (Refine), we keep it (so user can see old model or try again).
              // Status becomes 'timeout' to indicate we stopped polling.
              const timeoutStatus = 'timeout'
              const timeoutUrl = currentAsset?.modelUrl || null

              await db
                .update(message3DAssets)
                .set({ status: timeoutStatus, modelUrl: timeoutUrl })
                .where(eq(message3DAssets.id, assetId))
              broadcastUpdate(channelId, messageId, {
                status: timeoutStatus,
                modelUrl: timeoutUrl,
              })
              onComplete?.()
              resolve()
              return
            }

            try {
              const statusRes = await provider.getTaskStatus(taskId)
              console.log(
                `[3D-Job] Polling ${taskId}: ${statusRes.status} ${statusRes.progress}%`,
              )

              // Broadcast status including queue position if pending
              if (
                statusRes.status === 'PENDING' &&
                statusRes.preceding_tasks !== undefined
              ) {
                broadcastUpdate(channelId, messageId, {
                  status: 'queued',
                  modelUrl: null,
                  precedingTasks: statusRes.preceding_tasks,
                })
              }

              if (statusRes.status === 'SUCCEEDED') {
                clearInterval(pollInterval)
                const finalUrl =
                  statusRes.model_urls?.glb ||
                  statusRes.model_urls?.gameready_glb ||
                  statusRes.modelUrl

                await db
                  .update(message3DAssets)
                  .set({ status: successStatus, modelUrl: finalUrl })
                  .where(eq(message3DAssets.id, assetId))

                broadcastUpdate(channelId, messageId, {
                  status: successStatus,
                  modelUrl: finalUrl || '', // Fallback to empty string if somehow null
                })
                success = true
                onComplete?.()
                resolve()
              } else if (
                statusRes.status === 'FAILED' ||
                statusRes.status === 'EXPIRED'
              ) {
                // Check for Server Busy to retry
                if (
                  statusRes.task_error?.message?.toLowerCase().includes('busy')
                ) {
                  console.warn(
                    `[3D-Job] Server busy detected for ${taskId}. Will retry...`,
                  )
                  clearInterval(pollInterval)
                  resolve() // Break polling loop, let outer loop retry
                  return
                }

                clearInterval(pollInterval)
                await db
                  .update(message3DAssets)
                  .set({ status: failureStatus, modelUrl: failureUrl }) // Failed but keep URL
                  .where(eq(message3DAssets.id, assetId))
                broadcastUpdate(channelId, messageId, {
                  status: failureStatus,
                  modelUrl: failureUrl,
                })
                success = true // Stop outer loop
                onComplete?.()
                resolve()
              }
            } catch (e) {
              console.error('[3D-Job] Polling Error:', e)
            }
          }, 5000)
        })

        if (success) return

        // biome-ignore lint/suspicious/noExplicitAny: Error handling
      } catch (e: any) {
        console.error(`[3D-Job] Attempt ${retryCount + 1} Error:`, e)
        if (e.message?.toLowerCase().includes('busy') || e.status === 429) {
          // Continue to retry
        } else {
          // Hard fail logic
          await db
            .update(message3DAssets)
            .set({ status: failureStatus, modelUrl: failureUrl })
            .where(eq(message3DAssets.id, assetId))
          broadcastUpdate(channelId, messageId, {
            status: failureStatus,
            modelUrl: failureUrl,
          })
          onComplete?.()
          return
        }
      }

      retryCount++
      if (retryCount < MAX_RETRIES) {
        const waitTime = retryCount * 5000
        console.log(`[3D-Job] Waiting ${waitTime}ms before retry...`)
        await new Promise((r) => setTimeout(r, waitTime))
      }
    }

    // Final failure after retries
    if (!success) {
      await db
        .update(message3DAssets)
        .set({ status: failureStatus, modelUrl: failureUrl })
        .where(eq(message3DAssets.id, assetId))
      broadcastUpdate(channelId, messageId, {
        status: failureStatus,
        modelUrl: failureUrl,
      })
      onComplete?.()
    }
  } else {
    // Fallback to Mock
    runMock(db, channelId, messageId, assetId, broadcastUpdate)
    setTimeout(() => onComplete?.(), 7000)
  }
}
