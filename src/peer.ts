import net from "net"
import { PeerMessage } from "./types"
import { decodeMessage, encodeMessage } from "./protocol"

export class Peer {
  private balance = 0
  private socket?: net.Socket
  private buffer = ''
  private processedMessages = new Set<string>()

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
      console.log("Peer connected")

      this.socket = socket

      socket.on("data", (data) => {
        this.buffer += data.toString()

        const messages = this.buffer.split("\n")
        this.buffer = messages.pop() || ""

        for (const raw of messages) {
          const msg = decodeMessage(raw)
          this.handleMessage(msg)
        }
      })
    })

    server.listen(this.listenPort, () => {
        console.log(`Listening on port ${this.listenPort}`)
    })
  }

  private connectToPeer() {
    const socket = net.createConnection({
      host: this.peerHost,
      port: this.peerPort
    })

    socket.on("connect", () => {
      console.log(`Connected to peer ${this.peerHost}:${this.peerPort}`)
    })

    socket.on("error", (err) => {
      console.log("Connection error:", err.message)

      //In the future, i'll implement an exponential backoff
      setTimeout(() => {
        this.connectToPeer()
      }, 2000)
    })

    this.socket = socket
  }

  private handleMessage(msg: PeerMessage) {
    if (this.processedMessages.has(msg.id)) {
      return
    }

    this.processedMessages.add(msg.id)

    if (msg.type === "payment") {
        this.balance += msg.amount
        console.log(`You were paid ${msg.amount}!`)
    }
  }

  private sendMessage(msg: PeerMessage) {
    if (!this.socket) {
      console.log("Not connected to peer")
      return
    }

    this.socket.write(encodeMessage(msg) + "\n")
  }

  pay(amount: number) {
    const msg: PeerMessage = {
      id: crypto.randomUUID(),
      type: "payment",
      amount
    }

    this.sendMessage(msg)

    this.balance -= amount
  }

  getBalance() {
    return this.balance
  }
}