# ChainChat

A peer-to-peer blockchain messenger with a Windows 95 desktop interface.

Every message is a cryptographically signed transaction, mined into blocks via Proof of Work, and delivered over a WebRTC mesh network. No servers store your messages — peers relay them directly.

## Features

- **Blockchain** — PoW mining with dynamic difficulty adjustment, fork resolution, orphan pool, transaction deduplication
- **P2P Networking** — WebRTC data channels for direct peer communication, WebSocket signaling server for peer discovery
- **Cryptography** — ECDSA keypair identity, message signing and verification, on-chain name registry
- **Win95 Desktop** — draggable/resizable windows, taskbar, start menu, desktop icons — 19 UI components
- **Apps** — Chat, Block Explorer, Network monitor, Settings, About

## Tech Stack

- **Nuxt 4** + **Vue 3** + **TypeScript**
- **Pinia** with persisted state
- **Tailwind CSS 4**
- **Web Workers** for mining
- **WebRTC** for P2P mesh
- **WebSocket** signaling server

## Getting Started

```bash
# Install dependencies
npm install

# Start signaling server + dev server
npm run dev:all
```

The app runs at `http://localhost:3000`, signaling server at `ws://localhost:3001`.

Open in two browser tabs to see P2P in action.

## Project Structure

```
app/
  components/
    win95/       # Windows 95 UI component library
    chat/        # Chat UI (messages, channels, peers)
    explorer/    # Block explorer (blocks, transactions, mempool)
    network/     # Network visualization (mesh graph, mining status)
    apps/        # App content panels (chat, explorer, network, settings, about)
  composables/   # WebRTC, signaling, mining, crypto, node state machine
  stores/        # Pinia stores (blockchain, chat, identity, peers, windows)
  lib/           # Core logic (blockchain, protocol, sync, crypto, fork resolution)
  workers/       # Mining web worker
server.js        # WebSocket signaling server
```

## License

MIT
