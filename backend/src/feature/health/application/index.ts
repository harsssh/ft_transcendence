export type HealthStatus = 'healthy' | 'unhealthy'

export type IHealthStatusUseCase = () => HealthStatus

type ExternalService = {
  name: 'db'
  status: 'healthy' | 'unhealthy'
}

export interface IHealthStatusRepository {
  getAll(): ExternalService[]
}

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
