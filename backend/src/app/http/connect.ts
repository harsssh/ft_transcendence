import type { ConnectRouter } from '@connectrpc/connect'
import { container } from '../../container.js'
import { CONTAINER_KEY_GET_HEALTH_STATUS_USE_CASE } from '../../feature/health/application/getHealthStatusUseCase.js'
import { registerHealthService } from './controller/health.js'

export default (router: ConnectRouter) => {
  registerHealthService(
    router,
    container.resolve(CONTAINER_KEY_GET_HEALTH_STATUS_USE_CASE),
  )
}
