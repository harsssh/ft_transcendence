
// Common types for 3D Providers

export type ProviderStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

export interface TextTo3DProvider {
	/**
	 * Start a Text-to-3D task
	 * @param prompt User prompt
	 * @returns external task ID
	 */
	createTask(prompt: string): Promise<string>

	/**
	 * Check status of a task
	 * @param taskId external task ID
	 */
	getTaskStatus(taskId: string): Promise<{
		status: ProviderStatus
		modelUrl?: string
		progress: number
		error?: string
	}>
}
