import readline from 'readline'
import { Peer } from './peer'
import { CliCommand } from './types'

export function startCLI(peer: Peer) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('Welcome to your peering relationship!')

  rl.on('line', (line) => {
    const [command, arg] = line.trim().split(' ')

    switch (command) {
      case CliCommand.BALANCE:
        console.log(peer.getBalance())
        break

      case CliCommand.PAY:
        const amount = Number(arg)
        peer.pay(amount)
        break

      case CliCommand.EXIT:
        console.log('Goodbye.')
        process.exit(0)

      default:
        console.log('Unknown command')
    }
  })
}
