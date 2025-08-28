import type { ConnectRouter } from '@connectrpc/connect'
import { HelloService } from '@workspace/generated/connectrpc/hello/v1/hello_pb'

export default (router: ConnectRouter) =>
  router.service(HelloService, {
    async say(req) {
      return {
        sentence: `You said: ${req.sentence}`,
      }
    },
  })
