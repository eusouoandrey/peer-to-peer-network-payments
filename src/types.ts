export type PeerMessage = {
  id: string
  type: string
  metadata?: {
    amount?: number
  }
}
