
// Common types for 3D Providers

export type ProviderStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

export type TaskStatusResponse = {
	status: ProviderStatus
	modelUrl?: string
	progress: number
	error?: string
	preceding_tasks?: number
	// Meshy specific
	model_urls?: {
		glb?: string
		fbx?: string
		usdz?: string
		obj?: string
		gameready_glb?: string
	}
	task_error?: {
		message?: string
	}
	mode?: string
}

export interface TextTo3DProvider {
	/**
	 * Start a Text-to-3D task
	 * @param prompt User prompt
	 * @returns external task ID
	 */
	createTask(prompt: string): Promise<string>


	/**
	 * Start a Refine task (texture generation)
	 * @param previewTaskId external ID of the preview task
	 * @returns external task ID of the refine task
	 */
	refineTask(previewTaskId: string): Promise<string>

	/**
	 * Check status of a task
	 * @param taskId external task ID
	 */
	getTaskStatus(taskId: string): Promise<TaskStatusResponse>
}
