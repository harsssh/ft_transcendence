import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import { fastify } from 'fastify'
import routes from './connect'

const server = fastify()
await server.register(fastifyConnectPlugin, { routes })
await server.listen({ host: 'localhost', port: 3000 })
console.log('server is listening at', server.addresses())
