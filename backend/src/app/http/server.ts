import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import { fastify } from 'fastify'
import routes from './connect'

export type HttpServerOption = {
  host: string
  port: number
}

export interface HttpServer {
  // Result 返してもいいのかな
  run: (option: HttpServerOption) => Promise<void>
}

// Connect の plugin で handler 登録する部分を抽象化したい
export const fastifyHttpServer: HttpServer = {
  run: async (option) => {
    const server = fastify()
    await server.register(fastifyConnectPlugin, { routes })
    await server.listen({ host: option.host, port: option.port })
    console.log('server is listening at', server.addresses())
  }
}

