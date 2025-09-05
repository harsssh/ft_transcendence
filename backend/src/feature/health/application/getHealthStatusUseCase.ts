export type HealthStatus = 'healthy' | 'unhealthy'

export type IGetHealthStatusUseCase = () => Promise<HealthStatus>

export interface IHealthCheckPort {
  getStatus(): Promise<HealthStatus>
}

export const CONTAINER_KEY_GET_HEALTH_STATUS_USE_CASE = 'getHealthStatusUseCase'

const createGetHealthStatusUseCase =
  (healthCheckTargets: IHealthCheckPort[]): IGetHealthStatusUseCase =>
  async () => {
    const statuses = await Promise.all(
      healthCheckTargets.map((t) => t.getStatus()),
    )

    return statuses.every((s) => s === 'healthy') ? 'healthy' : 'unhealthy'
  }

export default createGetHealthStatusUseCase
