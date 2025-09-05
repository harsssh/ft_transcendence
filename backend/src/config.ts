import type { IHealthCheckPort } from './feature/health/application/getHealthStatusUseCase.js'
import { sqliteHealthCheckAdapter } from './feature/health/infrastructure/sqliteHealthCheckAdapter.js'

export type ApplicationConfig = Readonly<{
  healthCheckTargets: IHealthCheckPort[]
  dbFilePath: string
}>

export const config: ApplicationConfig = {
  healthCheckTargets: [sqliteHealthCheckAdapter],
  dbFilePath: process.env.SQLITE_APP_DB_PATH,
}
