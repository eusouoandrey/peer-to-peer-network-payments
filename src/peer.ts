import net from "net"
import { PeerMessage } from "./types"
import { decodeMessage, encodeMessage } from "./protocol"

export class Peer {
  private balance = 0
  private socket?: net.Socket
  private buffer = ''

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