import { presenceClient } from '../app/contexts/presence'

// Rate Limit (1 req / 3 min)
export async function checkRateLimit(userId: number, limit: number = 1, windowSeconds: number = 180): Promise<{ allowed: boolean; remaining: number }> {
	const key = `ratelimit:3d:${userId}`

	// Try to set the key if it doesn't exist
	const result = await presenceClient.set(key, '1', { NX: true, EX: windowSeconds })

	if (result === 'OK') {
		return { allowed: true, remaining: 0 }
	}

	// Calculate remaining time
	const ttl = await presenceClient.ttl(key)
	return { allowed: false, remaining: ttl > 0 ? ttl : windowSeconds }
}

// New Job Lock Logic
export async function acquireJobLock(userId: number): Promise<boolean> {
	const key = `job_lock:3d:${userId}`
	console.log(`[RateLimit] Acquiring lock for ${userId}...`)
	const result = await presenceClient.set(key, 'locked', { NX: true, EX: 600 }) // 10 min fail-safe TTL
	console.log(`[RateLimit] Lock result for ${userId}: ${result}`)
	if (result === 'OK') return true
	return false
}

export async function releaseJobLock(userId: number) {
	const key = `job_lock:3d:${userId}`
	console.log(`[RateLimit] Releasing lock for ${userId}`)
	await presenceClient.del(key)
}
