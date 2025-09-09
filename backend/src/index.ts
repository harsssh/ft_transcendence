import { fastifyHttpServer } from './app/http/server.js'

fastifyHttpServer.run({
  host: 'localhost',
  port: 3000,
})
