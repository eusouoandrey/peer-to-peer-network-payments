import readline from "readline"
import { Peer } from "./peer"

export function startCLI(peer: Peer) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log("Welcome to your peering relationship!")

  rl.on("line", (line) => {
    const [command, arg] = line.trim().split(" ")

    switch (command) {
      case "balance":
        console.log(peer.getBalance())
        break

      case "pay":
        const amount = Number(arg)

        if (Number.isNaN(amount)) {
            console.log("Invalid amount")
            break
        }

        peer.pay(amount)
        break

      case "exit":
        console.log("Goodbye.")
        process.exit(0)

      default:
        console.log("Unknown command")
    }
  })
}