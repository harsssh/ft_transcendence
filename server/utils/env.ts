import { existsSync, readFileSync } from 'node:fs'

export function getSecret(
  key: string,
  secretName: string = key.toLowerCase(),
): string | undefined {
  // 1. Try Environment Variable (Priority)
  if (process.env[key]) {
    return process.env[key]
  }

  // 2. Try Docker Secret File
  const secretPath = `/run/secrets/${secretName}`
  if (existsSync(secretPath)) {
    try {
      return readFileSync(secretPath, 'utf8').trim()
    } catch (e) {
      console.log(`Failed to read secret ${secretName}:`, e)
    }
  }

  return undefined
}

export function getMeshyApiKey(): string | undefined {
  return getSecret('MESHY_API_KEY', 'meshy_api_key')
}
