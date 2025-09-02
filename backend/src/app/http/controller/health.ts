import type { ConnectRouter, MethodImpl } from '@connectrpc/connect'
import {
  HealthService,
  HealthStatus,
} from '@workspace/generated/connectrpc/health/v1/health_pb'
import type { IGetHealthStatusUseCase } from '../../../feature/health/application'

// DI することで Request -> Response の関数をテストできる
export const createCheckHealthMethod =
  (
    getHealthStatusUseCase: IGetHealthStatusUseCase,
  ): MethodImpl<typeof HealthService.method.checkHealth> =>
  async () => {
    const status = await getHealthStatusUseCase()
    switch (status) {
      case 'healthy':
        return {
          status: HealthStatus.HEALTHY,
          message: 'service is healthy',
        }
      case 'unhealthy':
        return {
          status: HealthStatus.UNHEALTHY,
          message: 'service is unhealthy',
        }
    }
  }

export const registerHealthService = (
  router: ConnectRouter,
  getHealthStatusUseCase: IGetHealthStatusUseCase,
) =>
  router.service(HealthService, {
    checkHealth: createCheckHealthMethod(getHealthStatusUseCase),
  })
