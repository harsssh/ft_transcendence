import type { AppEnv } from '../env.js'

export const requireEnv = <K extends keyof AppEnv>(key: K): AppEnv[K] => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`environment variable ${key} must be set`)
  }
  // ProcessEnv extends AppEnv なので問題なし
  return value as AppEnv[K]
}
