import type { IHealthStatusRepository } from '../infrastructure/sqlite'

export type HealthStatus = 'healthy' | 'unhealthy'

export type IHealthStatusUseCase = () => HealthStatus

export const createGetHealthStatusUseCase =
  (healthStatusRepository: IHealthStatusRepository): IHealthStatusUseCase =>
  () => {
    if (
      healthStatusRepository
        .getAll()
        .every(({ status }) => status === 'healthy')
    ) {
      return 'healthy'
    }

    return 'unhealthy'
  }
