import Database from 'better-sqlite3'

export const CONTAINER_KEY_DB = Symbol('db')

const createDBConnection = (dbFilePath: string) => {
  const db = new Database(dbFilePath)
  // refs: https://github.com/WiseLibs/better-sqlite3/blob/674ce6be68a26742d9e24f8672da7888cea0aebb/docs/performance.md
  db.pragma('journal_mode = WAL')
  return db
}

export default createDBConnection
