export type PeerMessage = {
  id: string
  type: string
  metadata?: {
    amount?: number
  }
}

export enum MessageType {
  PAYMENT_REQUEST = 'payment_request',
  PAYMENT_ACK = 'payment_ack'
}

export enum CliCommand {
  BALANCE = 'balance',
  PAY = 'pay',
  EXIT = 'exit'
}
