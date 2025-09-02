import { fastifyHttpServer } from './app/http/server'

console.log(process.env.SQLITE_APP_DB_PATH)
fastifyHttpServer.run({
  host: 'localhost',
  port: 3000,
})
