# Peer-to-Peer Peering Relationship (Technical Test)

This project implements a **peer-to-peer peering relationship** between
two parties using a simple TCP connection and an interactive CLI.

Each peer maintains its **own view of the balance** and communicates
directly with the other peer to exchange payment messages.

------------------------------------------------------------------------

# Overview

The program starts a peer node that:

1.  Opens a TCP server to accept connections from another peer
2.  Attempts to connect to the configured remote peer
3.  Maintains a single active connection between the two nodes
4.  Allows sending payments through a CLI
5.  Tracks the local balance independently

Each node maintains its own ledger view:

``` bash
  Action                Sender balance   Receiver balance
  --------------------- ---------------- ------------------
  start                 0                0
  Alice pays 10         -10              +10
  Alice pays 10 again   -20              +20
```

The peers communicate using newline-delimited JSON messages.

No state is persisted between runs, and no third-party servers are
involved.

------------------------------------------------------------------------

# Running the Program

Start two peers on different ports.

Example:

Terminal 1 (Alice)

``` bash
npm run start -- --port=5000 --peerPort=5001
```

Terminal 2 (Bob)

``` bash
npm run start -- --port=5001 --peerPort=5000
```

Example session:

    Welcome to your peering relationship!

    > balance
    0

    > pay 10
    Sent

    > balance
    -10

On the other peer:

    Welcome to your peering relationship!

    You were paid 10!

    > balance
    10

------------------------------------------------------------------------

# Architecture

The system consists of a single class representing a peer node.

    Peer
     ├── TCP Server (accept connections)
     ├── TCP Client (connect to remote peer)
     ├── Message Protocol
     ├── Payment Ledger
     └── CLI Interface

Each node simultaneously acts as:

-   a **server**, accepting inbound connections
-   a **client**, attempting to connect to its peer

This ensures that the peers can connect regardless of which one starts
first.

------------------------------------------------------------------------

# Networking Model

The networking layer uses the Node.js TCP module.

    net.createServer()
    net.createConnection()

Both peers run a server and attempt outbound connections.

To avoid duplicate connections, the implementation accepts **only one
active socket**. Any additional connection attempts are rejected.

Connection lifecycle:

    peer starts
       │
       ├── start TCP server
       │
       └── attempt connection to peer
               │
               ├── success → active connection
               └── failure → retry

If the connection drops, the peer attempts to reconnect automatically.

------------------------------------------------------------------------

# Message Protocol

Messages are encoded as newline-delimited JSON:

    JSON\n
    JSON\n
    JSON\n

Example:

``` json
{
  "id": "uuid",
  "type": "payment_request",
  "metadata": {
    "amount": 10
  }
}
```

Supported message types:

  Type              Purpose
  ----------------- -----------------------
  payment_request   request a payment
  payment_ack       acknowledge a payment

------------------------------------------------------------------------

# Payment Flow

Sending a payment follows a two-step protocol.

    Sender                     Receiver
       │                           │
       │ payment_request           │
       │──────────────────────────>│
       │                           │
       │                      add amount
       │                      send ack
       │                           │
       │ payment_ack               │
       │<──────────────────────────│
       │                           │
    subtract amount

Balances are updated as follows:

Receiver updates balance immediately when receiving a request.

Sender updates balance **only after receiving an acknowledgement**.

This prevents the sender from deducting funds for messages that were
never delivered.

------------------------------------------------------------------------

# Message Deduplication

Each message contains a UUID.

    processedMessages: Set<string>

If a message with the same ID is received twice, it is ignored.

This protects against:

-   duplicate TCP deliveries
-   reconnection edge cases

------------------------------------------------------------------------

# Handling Partial TCP Messages

TCP does not guarantee message boundaries.

Incoming data may contain:

-   partial messages
-   multiple messages in a single packet

To handle this, incoming data is buffered until a newline is
encountered.

Example:

    {msg1}\n{msg2}\n{msg3}\n

Processing flow:

    buffer += data
    split by "\n"
    process complete messages
    keep remaining partial message

------------------------------------------------------------------------

# CLI Commands

Available commands:
``` bash
  Command                 Description
  ----------------------- ------------------------
  balance                 prints current balance
  pay `<amount>`          sends payment
  exit                    closes program
```

Example:

    > pay 10
    Sent

    > balance
    -10

------------------------------------------------------------------------

# Design Choices

### Peer-to-peer TCP

The challenge requires:

-   two users on different machines
-   no central server

Direct TCP communication satisfies both constraints while remaining
simple and deterministic.

------------------------------------------------------------------------

### Single active connection

Multiple connections between peers create race conditions and duplicate
messages.

To prevent this, the implementation enforces:

    1 peer
    1 connection

Any additional connections are immediately closed.

------------------------------------------------------------------------

### Acknowledged payments

Balances are only finalized after receiving a `payment_ack`.

This ensures the sender does not update its ledger for a payment that
was never received.

------------------------------------------------------------------------

### Stateless system

The challenge specifies that state persistence is not required.

For this reason:

-   balances are stored in memory
-   pending payments are tracked in memory
-   restarting the program resets the ledger
