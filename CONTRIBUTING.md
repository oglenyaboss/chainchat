# Contributing to ChainChat

Thanks for your interest in contributing!

## Getting Started

```bash
# Clone the repo
git clone https://github.com/oglenyaboss/chainchat.git
cd chainchat

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start signaling server + dev server
npm run dev:all
```

Open `http://localhost:3000` in two browser tabs to test P2P messaging.

## Development

- **Frontend**: Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS 4
- **State**: Pinia with persisted state
- **Signaling server**: `server.js` (Node.js + ws)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Nuxt dev server |
| `npm run dev:signal` | Signaling server only |
| `npm run dev:all` | Both servers in parallel |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

## Code Style

- TypeScript strict mode — avoid `any`
- Immutable state updates (spread, not mutation)
- Small focused files (under 400 lines ideally)
- No `console.log` in production code

## Pull Requests

1. Fork the repo and create a feature branch
2. Make your changes
3. Run `npm run lint` and `npm test`
4. Open a PR with a clear description of the change

## Architecture

```
app/
  lib/           Core logic (blockchain, crypto, protocol, sync)
  composables/   Vue composables (WebRTC, signaling, mining, state machine)
  stores/        Pinia stores (blockchain, chat, identity, peers, windows)
  components/    UI components (win95/, chat/, explorer/, network/, apps/)
server.js        WebSocket signaling server
```

The `lib/` layer is pure TypeScript with no Vue dependencies — it's the easiest place to contribute.
