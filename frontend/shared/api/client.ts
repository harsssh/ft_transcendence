import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { HelloService } from '@workspace/generated/connectrpc/hello/v1/hello_pb'

const transport = createConnectTransport({
  // TODO: ハードコードやめたい
  baseUrl: 'http://localhost:3000',
})

export const client = {
  helloService: createClient(HelloService, transport),
}
