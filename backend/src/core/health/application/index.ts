export type HealthStatus = 'healthy' | 'unhealthy'

export interface IHealthApplicationService {
  getHealthStatus: () => HealthStatus
}

export const healthApplicationService: IHealthApplicationService = {
  getHealthStatus: () => 'healthy',
}
