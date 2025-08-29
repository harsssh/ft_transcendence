import { createClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'
import { HealthService } from '@workspace/generated/connectrpc/health/v1/health_pb'

const transport = createConnectTransport({
  // TODO: ハードコードやめたい
  baseUrl: 'http://localhost:3000',
})

export const client = {
  healthService: createClient(HealthService, transport),
}
