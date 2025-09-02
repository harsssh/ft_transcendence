import Database from 'better-sqlite3'
import type { IHealthCheckPort } from '../application'

export const sqliteHealthCheckAdapter: IHealthCheckPort = {
  getStatus: async () => {
    try {
      new Database(process.env.SQLITE_APP_DB_PATH)
      return 'healthy'
    } catch (e) {
      console.log(e)
      return 'unhealthy'
    }
  },
}
