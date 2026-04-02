export interface SignalingEvents {
  onPeerList: (peerIds: string[]) => void
  onSignal: (from: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) => void
  onPeerLeft: (peerId: string) => void
}

export function useSignaling(events: SignalingEvents) {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const manualMode = ref(false)
  const localSDP = ref<string>('')

  function connectRelay(peerId: string) {
    const config = useRuntimeConfig()
    const socket = new WebSocket(config.public.signalingUrl as string)

    socket.onopen = () => {
      connected.value = true
      socket.send(JSON.stringify({ type: 'register', peerId }))
    }

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data as string)
      if (msg.type === 'peers') {
        events.onPeerList(msg.peerIds)
      }
      else if (msg.type === 'signal') {
        events.onSignal(msg.from, msg.signal)
      }
      else if (msg.type === 'peer-left') {
        events.onPeerLeft(msg.peerId)
      }
    }

    socket.onclose = () => {
      connected.value = false
    }

    ws.value = socket
  }

  function sendSignal(target: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'signal', target, signal }))
    }
  }

  function disconnect() {
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
