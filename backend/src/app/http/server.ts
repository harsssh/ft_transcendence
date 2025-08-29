import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import { fastify } from 'fastify'
import routes from './connect'

export type HttpServerOption = {
  host: string
  port: number
}

export const runHttpServer = async (option: HttpServerOption) => {
  const server = fastify()
  await server.register(fastifyConnectPlugin, { routes })
  await server.listen({ host: option.host, port: option.port })
  console.log('server is listening at', server.addresses())
}
