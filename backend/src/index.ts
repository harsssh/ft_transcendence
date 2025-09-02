import { fastifyHttpServer } from './app/http/server'

fastifyHttpServer.run({
  host: 'localhost',
  port: 3000,
})
