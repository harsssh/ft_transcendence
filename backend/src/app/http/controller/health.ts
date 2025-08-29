import type { ConnectRouter, MethodImpl } from '@connectrpc/connect'
import {
  HealthService,
  HealthStatus,
} from '@workspace/generated/connectrpc/health/v1/health_pb'

const checkHealth: MethodImpl<typeof HealthService.method.checkHealth> = () => {
  return {
    status: HealthStatus.HEALTHY,
    message: 'service is available',
  }
}

export const registerHealthService = (router: ConnectRouter) =>
  router.service(HealthService, { checkHealth })
