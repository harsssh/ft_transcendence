import * as awilix from 'awilix'
import { sqliteHealthCheckAdapter } from './feature/health/infrastructure/sqlite.js'

export const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.CLASSIC,
  strict: true,
})

// 実は Promise を返してる (esModules: true のとき)
container.loadModules(['dist/**/*.js'], {
  formatName: 'camelCase',
  esModules: true,
  resolverOptions: {
    lifetime: awilix.Lifetime.SINGLETON,
  },
})

container.register({
  healthCheckTargets: awilix.asValue([sqliteHealthCheckAdapter]),
})
