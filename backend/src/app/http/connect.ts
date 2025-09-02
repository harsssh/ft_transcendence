import type { ConnectRouter } from '@connectrpc/connect'
import { createGetHealthStatusUseCase } from '../../feature/health/application'
import { sqliteHealthCheckAdapter } from '../../feature/health/infrastructure/sqlite'
import { registerHealthService } from './controller/health'

export default (router: ConnectRouter) => {
  registerHealthService(
    router,
    createGetHealthStatusUseCase([sqliteHealthCheckAdapter]),
  )
}
