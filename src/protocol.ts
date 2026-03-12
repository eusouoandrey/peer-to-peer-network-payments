import { PeerMessage } from "./types"

export function encodeMessage(msg: PeerMessage): string {
  return JSON.stringify(msg)
}

export function decodeMessage(data: string): PeerMessage {
  return JSON.parse(data)
}