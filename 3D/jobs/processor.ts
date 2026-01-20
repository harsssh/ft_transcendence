import { eq } from 'drizzle-orm'
import { message3DAssets } from '../../db/schema'
import { MeshyProvider } from '../provider/meshy'
import type { TextTo3DProvider } from '../provider/types'

type BroadcastUpdateFn = (
	channelId: number,
	messageId: number,
	asset: { status: string; modelUrl: string | null }
) => void

// Fallback Mock Logic
async function runMock(
	db: any,
	channelId: number,
	messageId: number,
	assetId: number,
	broadcastUpdate: BroadcastUpdateFn
) {
	setTimeout(async () => {
		await db.update(message3DAssets)
			.set({ status: 'generating' })
			.where(eq(message3DAssets.id, assetId))
		broadcastUpdate(channelId, messageId, { status: 'generating', modelUrl: null })

		setTimeout(async () => {
			const mockUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb'
			await db.update(message3DAssets)
				.set({ status: 'ready', modelUrl: mockUrl })
				.where(eq(message3DAssets.id, assetId))
			broadcastUpdate(channelId, messageId, { status: 'ready', modelUrl: mockUrl })
		}, 5000)
	}, 2000)
}

export async function resume3DGeneration(
	db: any,
	channelId: number,
	messageId: number,
	assetId: number,
	prompt: string,
	broadcastUpdate: BroadcastUpdateFn
) {
	const providerName = process.env.TEXT3D_PROVIDER || 'mock'
	let apiKey = process.env.MESHY_API_KEY

	if (providerName === 'meshy' && !apiKey) {
		try {
			// Try reading from Docker secret
			const fs = await import('fs')
			// Check if file exists first or just try reading
			if (fs.existsSync('/run/secrets/meshy_api_key')) {
				apiKey = fs.readFileSync('/run/secrets/meshy_api_key', 'utf8').trim()
			}
		} catch (e) {
			console.warn('[3D-Job] Failed to read secret:', e)
		}
	}

	console.log(`[3D-Job] Resuming ${providerName} job for asset ${assetId} (message ${messageId}): "${prompt}"`)

	// 1. (Skipped) Initial DB Insert - assumed done by caller

	broadcastUpdate(channelId, messageId, { status: 'queued', modelUrl: null })

	// 2. Select Provider
	if (providerName === 'meshy' && apiKey) {
		const provider = new MeshyProvider(apiKey)
		try {
			const taskId = await provider.createTask(prompt)

			// Update External ID
			await db.update(message3DAssets)
				.set({ externalId: taskId, status: 'generating' })
				.where(eq(message3DAssets.id, assetId))

			broadcastUpdate(channelId, messageId, { status: 'generating', modelUrl: null })

			// 3. Polling Loop
			const pollInterval = setInterval(async () => {
				try {
					const statusRes = await provider.getTaskStatus(taskId)
					console.log(`[3D-Job] Polling ${taskId}: ${statusRes.status} ${statusRes.progress}%`)

					if (statusRes.status === 'SUCCEEDED') {
						clearInterval(pollInterval)
						await db.update(message3DAssets)
							.set({ status: 'ready', modelUrl: statusRes.modelUrl })
							.where(eq(message3DAssets.id, assetId))
						broadcastUpdate(channelId, messageId, { status: 'ready', modelUrl: statusRes.modelUrl! })
					} else if (statusRes.status === 'FAILED' || statusRes.status === 'EXPIRED') {
						clearInterval(pollInterval)
						await db.update(message3DAssets)
							.set({ status: 'failed' })
							.where(eq(message3DAssets.id, assetId))
						broadcastUpdate(channelId, messageId, { status: 'failed', modelUrl: null })
					}
					// If PENDING or IN_PROGRESS, continue polling
				} catch (e) {
					console.error('[3D-Job] Polling Error:', e)
				}
			}, 5000) // Poll every 5s

		} catch (e) {
			console.error('[3D-Job] Creation Error:', e)
			await db.update(message3DAssets)
				.set({ status: 'failed' })
				.where(eq(message3DAssets.id, assetId))
			broadcastUpdate(channelId, messageId, { status: 'failed', modelUrl: null })
		}
	} else {
		// Fallback to Mock
		runMock(db, channelId, messageId, assetId, broadcastUpdate)
	}
}
