export type HealthStatus = 'healthy' | 'unhealthy'

export type IGetHealthStatusUseCase = () => Promise<HealthStatus>

export interface IHealthCheckPort {
  getStatus(): Promise<HealthStatus>
}

const createGetHealthStatusUseCase =
  (healthCheckTargets: IHealthCheckPort[]): IGetHealthStatusUseCase =>
  async () => {
    const statuses = await Promise.all(
      healthCheckTargets.map((t) => t.getStatus()),
    )

    return statuses.every((s) => s === 'healthy') ? 'healthy' : 'unhealthy'
  }

export default createGetHealthStatusUseCase
