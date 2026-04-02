<template>
  <div
    class="win95-splitter"
    :class="{ 'win95-splitter--dragging': isDragging }"
    @mousedown.prevent="startDrag"
  >
    <div class="win95-splitter__groove" />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  drag: [delta: number]
}>()

const isDragging = ref(false)

function startDrag(e: MouseEvent): void {
  isDragging.value = true
  let lastX = e.clientX

  function onMouseMove(ev: MouseEvent): void {
    const delta = ev.clientX - lastX
    lastX = ev.clientX
    emit('drag', delta)
  }

  function onMouseUp(): void {
    isDragging.value = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.win95-splitter {
  width: 6px;
  flex-shrink: 0;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--win95-surface);
  position: relative;
  /* 3D groove */
  border-left: 1px solid var(--win95-shadow);
  border-right: 1px solid var(--win95-highlight);
}

.win95-splitter__groove {
  width: 2px;
  height: 24px;
  border-left: 1px solid var(--win95-shadow);
  border-right: 1px solid var(--win95-highlight);
}

.win95-splitter--dragging {
  background: var(--win95-button-face);
}

.win95-splitter:hover .win95-splitter__groove {
  height: 40px;
}
</style>
