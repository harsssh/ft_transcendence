import type { ConnectRouter } from '@connectrpc/connect'
import { registerHealthService } from './controller/health.js'
import { container } from '../../container.js'

export default (router: ConnectRouter) => {
  registerHealthService(
    router,
    // createGetHealthStatusUseCase([sqliteHealthCheckAdapter]),
    container.resolve('getHealthStatusUseCase'),
  )
}
