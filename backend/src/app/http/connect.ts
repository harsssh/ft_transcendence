import type { ConnectRouter } from '@connectrpc/connect'
import { healthStatusRepositoryImpl } from '../../feature/health/infrastructure/sqlite'
import { registerHealthService } from './controller/health'

export default (router: ConnectRouter) => {
  registerHealthService(router, healthStatusRepositoryImpl)
}
