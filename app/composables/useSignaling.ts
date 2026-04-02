export interface SignalingEvents {
  onPeerList: (peerIds: string[]) => void
  onSignal: (from: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) => void
  onPeerLeft: (peerId: string) => void
}

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 3_000

export function useSignaling(events: SignalingEvents) {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const manualMode = ref(false)
  const localSDP = ref<string>('')
  let reconnectAttempts = 0
  let currentPeerId: string | null = null

  function connectRelay(peerId: string) {
    currentPeerId = peerId
    const config = useRuntimeConfig()
    const socket = new WebSocket(config.public.signalingUrl as string)

    socket.onopen = () => {
      connected.value = true
      reconnectAttempts = 0
      socket.send(JSON.stringify({ type: 'register', peerId }))
    }

    socket.onmessage = (event) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(event.data as string)
      }
      catch {
        return
      }

      if (msg.type === 'peers') {
        events.onPeerList(msg.peerIds as string[])
      }
      else if (msg.type === 'signal') {
        events.onSignal(msg.from as string, msg.signal as RTCSessionDescriptionInit | RTCIceCandidateInit)
      }
      else if (msg.type === 'peer-left') {
        events.onPeerLeft(msg.peerId as string)
      }
    }

    socket.onclose = () => {
      connected.value = false
      if (currentPeerId && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        setTimeout(() => connectRelay(currentPeerId!), RECONNECT_DELAY_MS)
      }
    }

    ws.value = socket
  }

  function sendSignal(target: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'signal', target, signal }))
    }
  }

  function disconnect() {
    currentPeerId = null
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  function generateManualOffer(sdp: string) {
    localSDP.value = btoa(sdp)
  }

  function parseManualAnswer(encoded: string): string {
    return atob(encoded)
  }

  return {
    connected,
    manualMode,
    localSDP,
    connectRelay,
    sendSignal,
    disconnect,
    generateManualOffer,
    parseManualAnswer,
  }
}
