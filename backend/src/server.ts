import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import { fastify } from 'fastify'
import routes from './connect'
import fastifyCors from '@fastify/cors'
import { cors as connectCors } from '@connectrpc/connect'

const server = fastify()
await server.register(fastifyCors, {
  origin: true,
  methods: [...connectCors.allowedMethods],
  allowedHeaders: [...connectCors.allowedHeaders],
  exposedHeaders: [...connectCors.exposedHeaders],
})
await server.register(fastifyConnectPlugin, { routes })
await server.listen({ host: 'localhost', port: 3000 })
console.log('server is listening at', server.addresses())
