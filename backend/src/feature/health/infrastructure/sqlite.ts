import Database from 'better-sqlite3'
import type { IHealthCheckPort } from '../application/getHealthStatusUseCase.js'

// TODO: repository 化する
// TODO: SQLITE_APP_DB_PATH が適切なパスであることを確認する
const db = new Database(process.env.SQLITE_APP_DB_PATH)

export const sqliteHealthCheckAdapter: IHealthCheckPort = {
  getStatus: async () => {
    try {
      db.prepare('SELECT 1').run()
      return 'healthy'
    } catch (e) {
      console.log(e)
      return 'unhealthy'
    }
  },
}
