import net from 'net'
import { PeerMessage } from './types'
import { decodeMessage, encodeMessage } from './protocol'
import crypto from 'crypto'

export class Peer {
  private balance = 0
  private socket?: net.Socket
  private buffer = ''
  private processedMessages = new Set<string>()
  private pendingPayments = new Map<string, number>()
  private connecting = false

  constructor(
    private listenPort: number,
    private peerHost: string,
    private peerPort: number
  ) {}

  start() {
    this.startServer()
    this.connectToPeer()
  }

  private startServer() {
    const server = net.createServer((socket) => {
      if (this.socket) {
        socket.destroy()
        return
      }

      this.registerSocket(socket)
    })

    server.listen(this.listenPort)
  }

  private connectToPeer() {
    if (this.socket || this.connecting) return
    this.connecting = true

    const socket = net.createConnection({
      host: this.peerHost,
      port: this.peerPort
    })

    socket.on('connect', () => {
      this.connecting = false

      if (this.socket) {
        socket.destroy()
        return
      }

      this.registerSocket(socket)
    })

    socket.on('error', (err) => {
      console.log('Connection error:', err.message)
    })

    socket.on('close', () => {
      this.connecting = false
      this.scheduleReconnect()
    })
  }

  private registerSocket(socket: net.Socket) {
    this.socket = socket

    socket.on('data', (data) => this.handleData(data))

    socket.on('close', () => {
      this.socket = undefined
      this.scheduleReconnect()
    })

    socket.on('error', (err) => {
      console.log('Socket error:', err.message)
    })
  }

  private scheduleReconnect() {
    if (this.socket || this.connecting) return

    setTimeout(() => {
      this.connectToPeer()
    }, 2000)
  }

  private handleData(data: Buffer | string) {
    this.buffer += data.toString()

    const messages = this.buffer.split('\n')
    this.buffer = messages.pop() || ''

    for (const raw of messages) {
      if (!raw.trim()) continue

      const msg = decodeMessage(raw)
      this.handleMessage(msg)
    }
  }

  private handleMessage(msg: PeerMessage) {
    if (this.processedMessages.has(msg.id)) return

    this.processedMessages.add(msg.id)

    if (msg.type === 'payment_request') {
      if (!msg.metadata?.amount) {
        console.log('Missing transaction amount')
        return
      }

      this.balance += msg.metadata.amount
      console.log(`You were paid ${msg.metadata.amount}!`)

      this.sendMessage({
        id: msg.id,
        type: 'payment_ack'
      })
    } else if (msg.type === 'payment_ack') {
      const amount = this.pendingPayments.get(msg.id)

      if (amount) {
        this.balance -= amount
        this.pendingPayments.delete(msg.id)
      }
    }
  }

  private sendMessage(msg: PeerMessage) {
    if (!this.socket) {
      console.log('Not connected to peer')
      return
    }

    this.socket.write(encodeMessage(msg) + '\n')
  }

  pay(amount: number) {
    if (Number.isNaN(amount)) {
      console.log('Invalid amount')
      return
    }

    const messageId = crypto.randomUUID()
    const msg: PeerMessage = {
      id: messageId,
      type: 'payment_request',
      metadata: { amount }
    }

    this.pendingPayments.set(messageId, amount)
    this.sendMessage(msg)
  }

  getBalance() {
    return this.balance
  }
}
