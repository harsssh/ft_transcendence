export type HealthStatus = 'healthy' | 'unhealthy'

export type IGetHealthStatusUseCase = () => Promise<HealthStatus>

export interface IHealthCheckPort {
  getStatus(): Promise<HealthStatus>
}

export const createGetHealthStatusUseCase =
  (targets: IHealthCheckPort[]): IGetHealthStatusUseCase =>
  async () => {
    const statuses = await Promise.all(targets.map((t) => t.getStatus()))

    return statuses.every((s) => s === 'healthy') ? 'healthy' : 'unhealthy'
  }
