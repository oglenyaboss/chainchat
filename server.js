import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'

// eslint-disable-next-line node/prefer-global/process
const port = Number.parseInt(process.env.PORT || '3001', 10)

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('chainchat signaling server')
})

const wss = new WebSocketServer({ server: httpServer })
const clients = new Map()

wss.on('connection', (ws) => {
  let clientId = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    }
    catch {
      return
    }

    if (msg.type === 'register') {
      clientId = msg.peerId
      clients.set(clientId, ws)
      const peerIds = Array.from(clients.keys()).filter(id => id !== clientId)
      ws.send(JSON.stringify({ type: 'peers', peerIds }))
      return
    }

    if (msg.type === 'signal' && msg.target) {
      const target = clients.get(msg.target)
      if (target && target.readyState === 1) {
        target.send(JSON.stringify({ ...msg, from: clientId }))
      }
    }
  })

  ws.on('close', () => {
    if (clientId) {
      clients.delete(clientId)
      for (const [id, client] of clients) {
        if (id !== clientId && client.readyState === 1) {
          client.send(JSON.stringify({ type: 'peer-left', peerId: clientId }))
        }
      }
    }
  })
})

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Signaling server running on port ${port}`)
})
