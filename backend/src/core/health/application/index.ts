export type HealthStatus = 'healthy' | 'unhealthy'

export type IHealthStatusUseCase = () => HealthStatus

export const createGetHealthStatusUseCase = (): IHealthStatusUseCase => () =>
  'healthy'
