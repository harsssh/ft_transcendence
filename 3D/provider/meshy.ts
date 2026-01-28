import type { Message3DStatus } from '../types'
import type { TextTo3DProvider, ProviderStatus, TaskStatusResponse } from './types'

const MESHY_API_BASE = 'https://api.meshy.ai/openapi/v2/text-to-3d'

export class MeshyProvider implements TextTo3DProvider {
	private apiKey: string

	constructor(apiKey: string) {
		this.apiKey = apiKey
	}

	async createTask(prompt: string): Promise<string> {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout

		try {
			const res = await fetch(MESHY_API_BASE, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mode: 'preview',
					prompt: prompt,
					art_style: 'realistic',
					should_remesh: true,
					enable_pbr: true,
					ai_model: 'meshy-4'
				}),
				signal: controller.signal
			})

			if (!res.ok) {
				const errText = await res.text()
				throw new Error(`Meshy API Error: ${res.status} - ${errText}`)
			}

			const data = await res.json()
			return data.result
		} finally {
			clearTimeout(timeoutId)
		}
	}

	async refineTask(previewTaskId: string): Promise<string> {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 60000)

		try {
			const res = await fetch(MESHY_API_BASE, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mode: 'refine',
					preview_task_id: previewTaskId,
					enable_pbr: true
				}),
				signal: controller.signal
			})

			if (!res.ok) {
				const errText = await res.text()
				throw new Error(`Meshy Refine Error: ${res.status} - ${errText}`)
			}

			const data = await res.json()
			return data.result
		} finally {
			clearTimeout(timeoutId)
		}
	}

	async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
		const res = await fetch(`${MESHY_API_BASE}/${taskId}`, {
			headers: {
				'Authorization': `Bearer ${this.apiKey}`
			}
		})

		if (!res.ok) {
			const errText = await res.text()
			throw new Error(`Meshy Status Error: ${res.status} - ${errText}`)
		}

		const data = await res.json()

		let status: ProviderStatus = 'IN_PROGRESS'
		if (data.status === 'SUCCEEDED') status = 'SUCCEEDED'
		else if (data.status === 'FAILED') status = 'FAILED'
		else if (data.status === 'EXPIRED') status = 'EXPIRED'
		else if (data.status === 'PENDING') status = 'PENDING'

		console.log('[Meshy] GetTaskStatus Response:', JSON.stringify(data, null, 2))

		return {
			status,
			modelUrl: data.model_urls?.glb,
			progress: data.progress,
			error: data.task_error?.message,
			preceding_tasks: data.preceding_tasks,
			model_urls: data.model_urls,
			task_error: data.task_error,
			mode: data.mode
		}
	}
}
