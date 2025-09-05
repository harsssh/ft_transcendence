import type { ConnectRouter } from '@connectrpc/connect'
import { registerHealthService } from './controller/health'
import { container } from '../../container'

export default (router: ConnectRouter) => {
  registerHealthService(
    router,
    // createGetHealthStatusUseCase([sqliteHealthCheckAdapter]),
    container.resolve('getHealthStatusUseCase'),
  )
}
