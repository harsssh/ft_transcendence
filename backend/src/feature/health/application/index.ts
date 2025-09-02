export type HealthStatus = 'healthy' | 'unhealthy'

export type IGetHealthStatusUseCase = () => HealthStatus

export interface IHealthCheckPort {
  getStatus(): HealthStatus
}

export const createGetHealthStatusUseCase =
  (targets: IHealthCheckPort[]): IGetHealthStatusUseCase =>
  () => {
    const statuses = targets.map((t) => t.getStatus())

    return statuses.every((s) => s === 'healthy') ? 'healthy' : 'unhealthy'
  }
