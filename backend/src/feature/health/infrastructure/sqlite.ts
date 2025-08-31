import Database from 'better-sqlite3'

type ExternalService = {
  name: 'db'
  status: 'healthy' | 'unhealthy'
}

export interface IHealthStatusRepository {
  getAll(): ExternalService[]
}

export const healthStatusRepositoryImpl: IHealthStatusRepository = {
  getAll: () => {
    try {
      new Database(process.env.SQLITE_APP_DB_PATH)
      return [{ name: 'db', status: 'healthy' }]
    } catch (e) {
      console.log(e)
      return [{ name: 'db', status: 'unhealthy' }]
    }
  },
}
