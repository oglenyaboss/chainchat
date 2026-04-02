import type { PeerMessage } from '~/lib/protocol'
import { deserializeMessage, serializeMessage } from '~/lib/protocol'

interface PeerConnection {
  connection: RTCPeerConnection
  channel: RTCDataChannel | null
  peerId: string
}

export interface WebRTCCallbacks {
  onMessage: (peerId: string, msg: PeerMessage) => void
  onChannelReady?: (peerId: string) => void
  onPeerDisconnected?: (peerId: string) => void
}

export function useWebRTC(callbacks: WebRTCCallbacks) {
  const connections = ref<Map<string, PeerConnection>>(new Map())
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]

  function createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers })

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        removePeer(peerId)
        callbacks.onPeerDisconnected?.(peerId)
      }
    }

    return pc
  }

  async function connectToPeer(
    peerId: string,
    sendSignal: (target: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) => void,
  ): Promise<void> {
    const pc = createPeerConnection(peerId)
    const channel = pc.createDataChannel('chainchat')

    setupChannel(channel, peerId)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(peerId, event.candidate.toJSON())
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignal(peerId, pc.localDescription!.toJSON())

    const newMap = new Map(connections.value)
    newMap.set(peerId, { connection: pc, channel, peerId })
    connections.value = newMap
  }

  async function handleSignal(
    peerId: string,
    signal: RTCSessionDescriptionInit | RTCIceCandidateInit,
    sendSignal: (target: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) => void,
  ): Promise<void> {
    let peerConn = connections.value.get(peerId)

    if (!peerConn) {
      const pc = createPeerConnection(peerId)

      pc.ondatachannel = (event) => {
        setupChannel(event.channel, peerId)
        const newMap = new Map(connections.value)
        const existing = newMap.get(peerId)
        if (existing) {
          newMap.set(peerId, { ...existing, channel: event.channel })
          connections.value = newMap
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, event.candidate.toJSON())
        }
      }

      peerConn = { connection: pc, channel: null, peerId }
      const newMap = new Map(connections.value)
      newMap.set(peerId, peerConn)
      connections.value = newMap
    }

    const pc = peerConn.connection

    if ('sdp' in signal) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal as RTCSessionDescriptionInit))
      if ((signal as RTCSessionDescriptionInit).type === 'offer') {
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal(peerId, pc.localDescription!.toJSON())
      }
    }
    else if ('candidate' in signal) {
      await pc.addIceCandidate(new RTCIceCandidate(signal as RTCIceCandidateInit))
    }
  }

  function setupChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      callbacks.onChannelReady?.(peerId)
    }

    channel.onmessage = (event) => {
      const msg = deserializeMessage(event.data)
      if (msg) {
        callbacks.onMessage(peerId, msg)
      }
    }
  }

  function broadcast(msg: PeerMessage) {
    const serialized = serializeMessage(msg)
    for (const peer of connections.value.values()) {
      if (peer.channel && peer.channel.readyState === 'open') {
        peer.channel.send(serialized)
      }
    }
  }

  function sendToPeer(peerId: string, msg: PeerMessage) {
    const peer = connections.value.get(peerId)
    if (peer?.channel && peer.channel.readyState === 'open') {
      peer.channel.send(serializeMessage(msg))
    }
  }

  function getConnectedPeerIds(): string[] {
    const ids: string[] = []
    for (const peer of connections.value.values()) {
      if (peer.channel && peer.channel.readyState === 'open') {
        ids.push(peer.peerId)
      }
    }
    return ids
  }

  function removePeer(peerId: string) {
    const peer = connections.value.get(peerId)
    if (peer) {
      peer.channel?.close()
      peer.connection.close()
      const newMap = new Map(connections.value)
      newMap.delete(peerId)
      connections.value = newMap
    }
  }

  function disconnectAll() {
    for (const peer of connections.value.values()) {
      peer.channel?.close()
      peer.connection.close()
    }
    connections.value = new Map()
  }

  return {
    connections,
    connectToPeer,
    handleSignal,
    broadcast,
    sendToPeer,
    getConnectedPeerIds,
    removePeer,
    disconnectAll,
  }
}
