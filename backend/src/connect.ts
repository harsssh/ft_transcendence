import type { ConnectRouter } from '@connectrpc/connect'
import { HelloService } from './generated/connectrpc/hello/v1/hello_pb'

export default (router: ConnectRouter) =>
  router.service(HelloService, {
    // implements rpc Say
    async say(req) {
      return {
        sentence: `You said: ${req.sentence}`,
      }
    },
  })
