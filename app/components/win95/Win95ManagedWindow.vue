<template>
  <div
    v-show="!win.minimized"
    class="mw"
    :class="{
      'mw--active': isActive,
      'mw--maximized': win.maximized,
    }"
    :style="windowStyle"
    @mousedown="wmStore.focusWindow(win.id)"
    @click.stop
  >
    <!-- Resize handles (only when not maximized) -->
    <template v-if="!win.maximized">
      <div class="mw__resize mw__resize--n" @mousedown.stop.prevent="startResize($event, 'n')" />
      <div class="mw__resize mw__resize--s" @mousedown.stop.prevent="startResize($event, 's')" />
      <div class="mw__resize mw__resize--e" @mousedown.stop.prevent="startResize($event, 'e')" />
      <div class="mw__resize mw__resize--w" @mousedown.stop.prevent="startResize($event, 'w')" />
      <div class="mw__resize mw__resize--ne" @mousedown.stop.prevent="startResize($event, 'ne')" />
      <div class="mw__resize mw__resize--nw" @mousedown.stop.prevent="startResize($event, 'nw')" />
      <div class="mw__resize mw__resize--se" @mousedown.stop.prevent="startResize($event, 'se')" />
      <div class="mw__resize mw__resize--sw" @mousedown.stop.prevent="startResize($event, 'sw')" />
    </template>

    <!-- Title bar -->
    <div
      class="mw__titlebar"
      :class="{ 'mw__titlebar--inactive': !isActive }"
      @mousedown.stop.prevent="startDrag"
      @dblclick="wmStore.toggleMaximize(win.id)"
    >
      <Win95Icon :name="win.icon" :size="13" class="mw__icon" />
      <span class="mw__title">{{ win.title }}</span>
      <div class="mw__controls">
        <button class="mw__btn" title="Minimize" @mousedown.stop @click.stop="wmStore.minimizeWindow(win.id)">
          <span class="mw__btn-icon">&#9472;</span>
        </button>
        <button class="mw__btn" title="Maximize" @mousedown.stop @click.stop="wmStore.toggleMaximize(win.id)">
          <span class="mw__btn-icon" v-html="win.maximized ? '&#10064;' : '&#9744;'" />
        </button>
        <button class="mw__btn mw__btn--close" title="Close" @mousedown.stop @click.stop="wmStore.closeWindow(win.id)">
          <span class="mw__btn-icon">&times;</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="mw__content">
      <slot />
    </div>

    <!-- Resize grip (bottom-right visual indicator) -->
    <div v-if="!win.maximized" class="mw__grip" />
  </div>
</template>

<script setup lang="ts">
import type { WindowState } from '~/stores/window-manager'
import { useWindowManagerStore } from '~/stores/window-manager'

const props = defineProps<{
  win: WindowState
}>()

const wmStore = useWindowManagerStore()

const isActive = computed(() => wmStore.activeWindowId === props.win.id)

const windowStyle = computed(() => {
  if (props.win.maximized) {
    return {
      position: 'absolute' as const,
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      zIndex: props.win.zIndex,
    }
  }
  return {
    position: 'absolute' as const,
    left: `${props.win.x}px`,
    top: `${props.win.y}px`,
    width: `${props.win.width}px`,
    height: `${props.win.height}px`,
    zIndex: props.win.zIndex,
  }
})

function startDrag(e: MouseEvent): void {
  if (props.win.maximized) return

  wmStore.focusWindow(props.win.id)

  const startX = e.clientX
  const startY = e.clientY
  const startWinX = props.win.x
  const startWinY = props.win.y

  function onMouseMove(ev: MouseEvent): void {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    wmStore.moveWindow(
      props.win.id,
      startWinX + dx,
      Math.max(0, startWinY + dy),
    )
  }

  function onMouseUp(): void {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'move'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function startResize(e: MouseEvent, dir: string): void {
  if (props.win.maximized) return

  wmStore.focusWindow(props.win.id)

  const startX = e.clientX
  const startY = e.clientY
  const startRect = {
    x: props.win.x,
    y: props.win.y,
    width: props.win.width,
    height: props.win.height,
  }

  const cursorMap: Record<string, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
    sw: 'nesw-resize',
  }

  function onMouseMove(ev: MouseEvent): void {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY

    let { x, y, width, height } = startRect

    if (dir.includes('e')) width = startRect.width + dx
    if (dir.includes('w')) {
      width = startRect.width - dx
      x = startRect.x + dx
    }
    if (dir.includes('s')) height = startRect.height + dy
    if (dir.includes('n')) {
      height = startRect.height - dy
      y = startRect.y + dy
    }

    const minW = props.win.minWidth
    const minH = props.win.minHeight

    if (width < minW) {
      if (dir.includes('w')) x = startRect.x + startRect.width - minW
      width = minW
    }
    if (height < minH) {
      if (dir.includes('n')) y = startRect.y + startRect.height - minH
      height = minH
    }

    wmStore.resizeWindow(props.win.id, { x, y, width, height })
  }

  function onMouseUp(): void {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.body.style.userSelect = 'none'
  document.body.style.cursor = cursorMap[dir] ?? 'default'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.mw {
  position: absolute;
  background: var(--win95-surface);
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--win95-highlight);
  border-left: 2px solid var(--win95-highlight);
  border-right: 2px solid var(--win95-dark-shadow);
  border-bottom: 2px solid var(--win95-dark-shadow);
  box-shadow: 1px 1px 0 var(--win95-text);
  outline: 1px solid var(--win95-text);
  /* Open animation */
  animation: mw-open 0.12s ease-out;
}

.mw--maximized {
  box-shadow: none;
  outline: none;
  animation: none;
}

@keyframes mw-open {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- Title bar --- */
.mw__titlebar {
  display: flex;
  align-items: center;
  padding: 2px 3px;
  gap: 3px;
  background: linear-gradient(90deg, var(--win95-titlebar) 0%, #1084D0 100%);
  user-select: none;
  height: 22px;
  flex-shrink: 0;
  cursor: default;
}

.mw__titlebar--inactive {
  background: linear-gradient(90deg, var(--win95-titlebar-inactive) 0%, #B5B5B5 100%);
}

.mw__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--win95-titlebar-text);
}

.mw__title {
  font-family: var(--win95-font-ui);
  font-size: 12px;
  font-weight: 700;
  color: var(--win95-titlebar-text);
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-left: 2px;
}

.mw__controls {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.mw__btn {
  width: 16px;
  height: 14px;
  background: var(--win95-button-face);
  border-top: 1px solid var(--win95-highlight);
  border-left: 1px solid var(--win95-highlight);
  border-right: 1px solid var(--win95-dark-shadow);
  border-bottom: 1px solid var(--win95-dark-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.mw__btn:active {
  border-top: 1px solid var(--win95-dark-shadow);
  border-left: 1px solid var(--win95-dark-shadow);
  border-right: 1px solid var(--win95-highlight);
  border-bottom: 1px solid var(--win95-highlight);
}

.mw__btn-icon {
  color: var(--win95-text);
  font-weight: 700;
  font-size: 10px;
  line-height: 1;
}

/* --- Content --- */
.mw__content {
  flex: 1;
  overflow: auto;
  padding: 2px;
  min-height: 0;
}

/* --- Resize handles --- */
.mw__resize {
  position: absolute;
  z-index: 10;
}

.mw__resize--n  { top: 0; left: 8px; right: 8px; height: 4px; cursor: ns-resize; }
.mw__resize--s  { bottom: 0; left: 8px; right: 8px; height: 4px; cursor: ns-resize; }
.mw__resize--e  { right: 0; top: 8px; bottom: 8px; width: 4px; cursor: ew-resize; }
.mw__resize--w  { left: 0; top: 8px; bottom: 8px; width: 4px; cursor: ew-resize; }
.mw__resize--ne { top: 0; right: 0; width: 8px; height: 8px; cursor: nesw-resize; }
.mw__resize--nw { top: 0; left: 0; width: 8px; height: 8px; cursor: nwse-resize; }
.mw__resize--se { bottom: 0; right: 0; width: 8px; height: 8px; cursor: nwse-resize; }
.mw__resize--sw { bottom: 0; left: 0; width: 8px; height: 8px; cursor: nesw-resize; }

/* --- Resize grip indicator (bottom-right) --- */
.mw__grip {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  z-index: 11;
  background:
    linear-gradient(
      135deg,
      transparent 30%,
      var(--win95-highlight) 30%,
      var(--win95-highlight) 40%,
      var(--win95-dark-shadow) 40%,
      var(--win95-dark-shadow) 50%,
      transparent 50%,
      transparent 60%,
      var(--win95-highlight) 60%,
      var(--win95-highlight) 70%,
      var(--win95-dark-shadow) 70%,
      var(--win95-dark-shadow) 80%,
      transparent 80%
    );
}

/* --- Active window slight depth --- */
.mw--active {
  box-shadow: 1px 1px 0 var(--win95-text), 2px 4px 12px rgba(0, 0, 0, 0.18);
}

.mw--active.mw--maximized {
  box-shadow: none;
}
</style>
