export type ChannelParticipant = {
  userId: number
  name: string
}

export type Channel = {
  id: number
  name: string
  participants: ChannelParticipant[]
}
