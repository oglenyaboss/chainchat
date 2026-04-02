<script setup lang="ts">
import type { ConnectedPeer } from '~/stores/peers'

const props = defineProps<{
  peers: ConnectedPeer[]
  myPeerId: string
  width?: number
  height?: number
}>()

const width = computed(() => props.width ?? 600)
const height = computed(() => props.height ?? 400)

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null

interface NodePosition {
  x: number
  y: number
  vx: number
  vy: number
  label: string
  isMe: boolean
}

const nodes = ref<NodePosition[]>([])

watch(
  () => [props.peers, props.myPeerId],
  () => {
    const allPeers = [
      { peerId: props.myPeerId, nickname: 'You', isMe: true },
      ...props.peers.map(p => ({ peerId: p.peerId, nickname: p.nickname, isMe: false })),
    ]

    const existing = new Map(nodes.value.map(n => [n.label, n]))
    const cx = width.value / 2
    const cy = height.value / 2

    nodes.value = allPeers.map((peer, i) => {
      const ex = existing.get(peer.nickname)
      if (ex)
        return { ...ex, isMe: peer.isMe }

      const angle = (2 * Math.PI * i) / allPeers.length
      const r = Math.min(width.value, height.value) * 0.3
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        label: peer.nickname,
        isMe: peer.isMe,
      }
    })
  },
  { immediate: true, deep: true },
)

function draw() {
  const canvas = canvasRef.value
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // Win95-style white background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width.value, height.value)

  // Draw connections — dark gray lines
  ctx.strokeStyle = '#808080'
  ctx.lineWidth = 1
  for (let i = 0; i < nodes.value.length; i++) {
    for (let j = i + 1; j < nodes.value.length; j++) {
      const ni = nodes.value[i]!
      const nj = nodes.value[j]!
      ctx.beginPath()
      ctx.moveTo(ni.x, ni.y)
      ctx.lineTo(nj.x, nj.y)
      ctx.stroke()
    }
  }

  // Draw nodes
  for (const node of nodes.value) {
    // Node circle
    ctx.fillStyle = node.isMe ? '#008080' : '#000080'
    ctx.beginPath()
    ctx.arc(node.x, node.y, 8, 0, Math.PI * 2)
    ctx.fill()

    // 3D highlight
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(node.x - 1, node.y - 1, 8, Math.PI, Math.PI * 1.5)
    ctx.stroke()

    // Label
    ctx.fillStyle = '#000000'
    ctx.font = '11px Silkscreen, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(node.label, node.x, node.y + 20)

    // Animate
    node.x += node.vx
    node.y += node.vy
    if (node.x < 30 || node.x > width.value - 30)
      node.vx *= -1
    if (node.y < 30 || node.y > height.value - 30)
      node.vy *= -1
  }

  animationId = requestAnimationFrame(draw)
}

onMounted(() => {
  draw()
})

onUnmounted(() => {
  if (animationId)
    cancelAnimationFrame(animationId)
})
</script>

<template>
  <div class="mesh-graph win95-inset">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="mesh-graph__canvas"
    />
  </div>
</template>

<style scoped>
.mesh-graph {
  background: var(--win95-input-bg);
  padding: 2px;
}

.mesh-graph__canvas {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
}
</style>
