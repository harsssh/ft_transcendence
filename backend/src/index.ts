import { fastifyHttpServer } from './app/http/server.js'

fastifyHttpServer.run({
  host: '0.0.0.0',
  port: 3000,
})
