import { Peer } from "./peer"
import { startCLI } from "./cli"

const listenPort = Number(process.argv[2])
const peerHost = process.argv[3]
const peerPort = Number(process.argv[4])

if (!listenPort || !peerHost || !peerPort) {
  console.log("Usage:")
  console.log("npm start <listenPort> <peerHost> <peerPort>")
  process.exit(1)
}

const peer = new Peer(listenPort, peerHost, peerPort)

peer.start()

startCLI(peer)