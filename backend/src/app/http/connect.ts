import type { ConnectRouter } from '@connectrpc/connect'
import { registerHealthService } from './controller/health'

export default (router: ConnectRouter) => {
  registerHealthService(router)
}
