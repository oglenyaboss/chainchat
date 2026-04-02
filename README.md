<div align="center">

# ChainChat

**Peer-to-peer blockchain messenger with a Windows 95 desktop interface**

[![CI](https://github.com/oglenyaboss/chainchat/actions/workflows/ci.yml/badge.svg)](https://github.com/oglenyaboss/chainchat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Live Demo](https://chainchat-two.vercel.app/) &middot; [Contributing](CONTRIBUTING.md) &middot; [License](LICENSE)

Every message is a cryptographically signed transaction, mined into blocks via Proof of Work, and delivered over a WebRTC mesh network. No servers store your messages — peers relay them directly.

</div>

![All windows open](docs/all-windows.png)

<details>
<summary>More screenshots</summary>

|   |   |
|---|---|
| ![Desktop](docs/desktop.png) | ![Chat](docs/chat.png) |
| ![Block Explorer](docs/explorer.png) | |

</details>

---

## Why

I had a Nuxt.js course at university. I'd been writing Next.js for about two years at that point, so the standard curriculum didn't feel like a challenge. Instead of doing the bare minimum, I decided to push the limits of what you can build entirely in the browser — no backend database, no message queue, no centralized anything.

The result is a full blockchain implementation running client-side: Proof of Work mining in a Web Worker, WebRTC mesh networking between peers, ECDSA/ECDH cryptography via the native Web Crypto API, and a complete Windows 95 desktop environment as the UI. The only server is a tiny WebSocket relay (~50 lines) that helps peers find each other — after that, everything is direct.

This is a sibling project to [llmshowcase](https://github.com/oglenyaboss/llmshowcase), where I explored running LLM inference directly in the browser. Same idea — take something that "should" need a server and prove it doesn't.

---

## Features

| | |
|---|---|
| **Blockchain** | PoW mining with dynamic difficulty, fork resolution, orphan pool, deduplication |
| **P2P Networking** | WebRTC data channels, WebSocket signaling for peer discovery |
| **Cryptography** | ECDSA identity, ECDH key exchange, AES-GCM encrypted DMs, on-chain name registry |
| **Win95 Desktop** | Draggable/resizable windows, taskbar, start menu, desktop icons |
| **Apps** | Chat, Block Explorer, Network monitor, Settings, About |

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Win95 UI Components           │
│  (18 components: windows, taskbar, etc) │
├─────────┬──────────┬─────────┬──────────┤
│  Chat   │ Explorer │ Network │ Settings │
├─────────┴──────────┴─────────┴──────────┤
│             Composables                 │
│   useNodeStateMachine (orchestrator)    │
│   useWebRTC · useSignaling · useMining  │
├─────────────────────────────────────────┤
│             Pinia Stores                │
│   blockchain · chat · identity · peers  │
├─────────────────────────────────────────┤
│              Core lib/                  │
│   blockchain · crypto · sync · protocol │
│   fork-resolution · orphan-pool         │
│   deduplication · name-registry         │
└─────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 + Vue 3 + TypeScript |
| State | Pinia with persisted state |
| Styling | Tailwind CSS 4 |
| Mining | Web Workers (off-thread PoW) |
| Networking | WebRTC mesh + WebSocket signaling |
| Cryptography | Web Crypto API (zero external deps) |

---

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev:all
```

App runs at `http://localhost:3000`, signaling server at `ws://localhost:3001`.
Open in **two browser tabs** to see P2P messaging in action.

**Requirements:** Node.js 22+ &middot; Chrome, Firefox, Edge, or Safari 15+

> **Can't connect to peers?** Stale identity data can prevent WebRTC handshakes. Fix: **Settings > Danger Zone > Reset Identity**, then reload.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Dev server + signaling server |
| `npm run build` | Production build |
| `npm test` | Run 135 unit tests |
| `npm run lint` | Lint with @antfu/eslint-config |

---

## Project Structure

```
app/
  lib/           # Core: blockchain, crypto, sync, protocol, fork resolution
  composables/   # Orchestration: WebRTC, signaling, mining, state machine
  stores/        # State: blockchain, chat, identity, peers, window manager
  components/
    win95/       # 18 Windows 95 UI components
    chat/        # Chat UI (messages, channels, peers)
    explorer/    # Block explorer (blocks, transactions, mempool)
    network/     # Network graph + mining status
    apps/        # App content panels
  workers/       # Mining web worker
server.js        # WebSocket signaling server (~50 lines)
```

---

## Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel (or any Nuxt-compatible host) |
| Signaling server | Railway via `Dockerfile` |

Set `NUXT_PUBLIC_SIGNALING_URL` to point the frontend at the deployed signaling server.

---

<div align="center">

**[MIT License](LICENSE)** &middot; Built with Nuxt, Vue, and way too much nostalgia for Windows 95

</div>
