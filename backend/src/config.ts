import type { IHealthCheckPort } from './feature/health/application/getHealthStatusUseCase.js'
import { sqliteHealthCheckAdapter } from './feature/health/infrastructure/sqliteHealthCheckAdapter.js'
import { requireEnv } from './utils/requireEnv.js'

export type ApplicationConfig = Readonly<{
  healthCheckTargets: IHealthCheckPort[]
  dbFilePath: string
}>

export const config: ApplicationConfig = {
  healthCheckTargets: [sqliteHealthCheckAdapter],
  dbFilePath: requireEnv('SQLITE_APP_DB_PATH'),
}
