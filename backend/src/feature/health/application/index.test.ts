import { describe, expect, it } from 'vitest'
import createGetHealthStatusUseCase, {
  type IHealthCheckPort,
} from './getHealthStatusUseCase.js'

describe('GetHealthStatusUseCase', () => {
  const healthyPort: IHealthCheckPort = { getStatus: async () => 'healthy' }
  const unhealthyPort: IHealthCheckPort = { getStatus: async () => 'unhealthy' }

  it(`should return 'healthy' if every service is healthy`, async () => {
    const getHealthStatusUseCase = createGetHealthStatusUseCase([
      healthyPort,
      healthyPort,
      healthyPort,
    ])

    expect(await getHealthStatusUseCase()).toBe('healthy')
  })

  it(`should return 'unhealthy' if one of services is unhealthy`, async () => {
    const getHealthStatusUseCase = createGetHealthStatusUseCase([
      healthyPort,
      healthyPort,
      unhealthyPort,
    ])

    expect(await getHealthStatusUseCase()).toBe('unhealthy')
  })
})
