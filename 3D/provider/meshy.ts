import type { Message3DStatus } from '../types'
import type { TextTo3DProvider, ProviderStatus } from './types'

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v2/text-to-3d'

export class MeshyProvider implements TextTo3DProvider {
	private apiKey: string

	constructor(apiKey: string) {
		this.apiKey = apiKey
	}

	async createTask(prompt: string): Promise<string> {
		const res = await fetch(MESHY_API_BASE, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				mode: 'preview', // v2 preview is fast
				prompt: prompt,
				art_style: 'realistic', // default
				should_remesh: true // nicer topo
			})
		})

		if (!res.ok) {
			const errText = await res.text()
			throw new Error(`Meshy API Error: ${res.status} - ${errText}`)
		}

		const data = await res.json()
		// data.result is task ID in v2
		return data.result
	}

	async getTaskStatus(taskId: string): Promise<{
		status: ProviderStatus
		modelUrl?: string
		progress: number
		error?: string
	}> {
		const res = await fetch(`${MESHY_API_BASE}/${taskId}`, {
			headers: {
				'Authorization': `Bearer ${this.apiKey}`
			}
		})

		if (!res.ok) {
			// 404 or others
			return { status: 'FAILED', progress: 0, error: `API Error ${res.status}` }
		}

		const data = await res.json()
		// v2 response structure: { status: 'SUCCEEDED' | 'IN_PROGRESS' | ..., model_urls: { glb: ... }, progress: 100 }

		let status: ProviderStatus = 'IN_PROGRESS'
		if (data.status === 'SUCCEEDED') status = 'SUCCEEDED'
		else if (data.status === 'FAILED') status = 'FAILED'
		else if (data.status === 'EXPIRED') status = 'EXPIRED'
		else if (data.status === 'PENDING') status = 'PENDING'

		// Map Meshy status to our common status
		return {
			status,
			modelUrl: data.model_urls?.glb,
			progress: data.progress ?? 0,
			error: data.task_error?.message
		}
	}
}
