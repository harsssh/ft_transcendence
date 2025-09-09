import type { Database } from 'better-sqlite3'
import { container } from '../../../container.js'
import { CONTAINER_KEY_DB } from '../../../infrastructure/db.js'
import type { IHealthCheckPort } from '../application/getHealthStatusUseCase.js'

export const sqliteHealthCheckAdapter: IHealthCheckPort = {
  getStatus: async () => {
    const db = container.resolve<Database>(CONTAINER_KEY_DB)
    try {
      db.prepare('SELECT 1').run()
      return 'healthy'
    } catch (e) {
      console.log(e)
      return 'unhealthy'
    }
  },
}
