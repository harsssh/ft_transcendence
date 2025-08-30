import type { ConnectRouter, MethodImpl } from '@connectrpc/connect'
import {
  HealthService,
  HealthStatus,
} from '@workspace/generated/connectrpc/health/v1/health_pb'
import {
  createGetHealthStatusUseCase,
  type IHealthStatusUseCase,
} from '../../../core/health/application'

// DI することで Request -> Response の関数をテストできる
export const createCheckHealthMethod =
  (
    getHealthStatusUseCase: IHealthStatusUseCase,
  ): MethodImpl<typeof HealthService.method.checkHealth> =>
  () => {
    const status = getHealthStatusUseCase()
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

// 必要なら IHealthApplicationService を注入してもよい
export const registerHealthService = (router: ConnectRouter) =>
  router.service(HealthService, {
    checkHealth: createCheckHealthMethod(createGetHealthStatusUseCase()),
  })
