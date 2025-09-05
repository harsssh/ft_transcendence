import * as awilix from 'awilix'
import { sqliteHealthCheckAdapter } from './feature/health/infrastructure/sqlite.js'

export const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.CLASSIC,
  strict: true,
})

container.loadModules(['**/*.ts'], {
  formatName: 'camelCase',
  resolverOptions: {
    lifetime: awilix.Lifetime.SINGLETON,
  },
})

container.register({
  healthCheckTargets: awilix.asValue([sqliteHealthCheckAdapter]),
})
