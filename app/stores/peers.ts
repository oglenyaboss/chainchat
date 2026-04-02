import { defineStore } from 'pinia'
import type { PeerInfo } from '~/lib/protocol'

export interface ConnectedPeer extends PeerInfo {
  readonly connectedAt: number
  readonly hashrate: number
  readonly latency: number
}

export const usePeerStore = defineStore('peers', () => {
  const peers = ref<Map<string, ConnectedPeer>>(new Map())

  const peerList = computed(() => Array.from(peers.value.values()))
  const peerCount = computed(() => peers.value.size)

  function addPeer(info: PeerInfo) {
    const newMap = new Map(peers.value)
    newMap.set(info.peerId, {
      ...info,
      connectedAt: Date.now(),
      hashrate: 0,
      latency: 0,
    })
    peers.value = newMap
  }

  function removePeer(peerId: string) {
    const newMap = new Map(peers.value)
    newMap.delete(peerId)
    peers.value = newMap
  }

  function updatePeerHashrate(peerId: string, hashrate: number) {
    const peer = peers.value.get(peerId)
    if (peer) {
      const newMap = new Map(peers.value)
      newMap.set(peerId, { ...peer, hashrate })
      peers.value = newMap
    }
  }

  function getPeer(peerId: string): ConnectedPeer | undefined {
    return peers.value.get(peerId)
  }

  return { peers, peerList, peerCount, addPeer, removePeer, updatePeerHashrate, getPeer }
})
