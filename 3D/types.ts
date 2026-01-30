export type Message3DStatus =
  | 'queued'
  | 'generating'
  | 'refining'
  | 'ready'
  | 'failed'
  | 'refined'
  | 'timeout'

export interface Message3DAsset {
  id: number
  messageId: number
  status: Message3DStatus
  modelUrl: string | null
  prompt: string
  createdAt: Date
  updatedAt: Date
}
