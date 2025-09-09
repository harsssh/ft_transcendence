import type { ConnectRouter } from '@connectrpc/connect'
import { container } from '../../container.js'
import { registerHealthService } from './controller/health.js'

export default (router: ConnectRouter) => {
  registerHealthService(router, container.resolve('getHealthStatusUseCase'))
}
