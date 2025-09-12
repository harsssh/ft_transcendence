import * as awilix from 'awilix'
import { config } from './config.js'
import type { Cradle } from './generated/awilix-types.js'

export const container = awilix.createContainer<Cradle>({
  injectionMode: awilix.InjectionMode.CLASSIC,
  strict: true,
})

// 実は Promise を返してる (esModules: true のとき)
// NOTE: foo.ts で bar を default export すると、foo という名前で bar が register される
container.loadModules(['dist/**/*.js'], {
  formatName: 'camelCase',
  esModules: true,
  resolverOptions: {
    lifetime: awilix.Lifetime.SINGLETON,
  },
})

container.register(
  Object.fromEntries(
    Object.entries(config).map(([k, v]) => [k, awilix.asValue(v)]),
  ),
)
