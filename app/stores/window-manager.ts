import { defineStore } from 'pinia'

export interface WindowState {
  id: string
  title: string
  icon: string
  component: string
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}

interface WindowConfig {
  id: string
  title: string
  icon: string
  component: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
}

export const useWindowManagerStore = defineStore('window-manager', () => {
  const windows = ref<WindowState[]>([])
  const activeWindowId = ref<string | null>(null)
  let nextZIndex = 100

  const activeWindow = computed(() =>
    windows.value.find(w => w.id === activeWindowId.value) ?? null,
  )

  function openWindow(config: WindowConfig): void {
    const existing = windows.value.find(w => w.id === config.id)
    if (existing) {
      if (existing.minimized) {
        restoreWindow(config.id)
      }
      else {
        focusWindow(config.id)
      }
      return
    }

    const w = config.width ?? 640
    const h = config.height ?? 480
    const taskbarH = 40
    const availW = window.innerWidth
    const availH = window.innerHeight - taskbarH

    const offset = (windows.value.length % 8) * 30
    const x = Math.max(0, Math.min(50 + offset, availW - w - 20))
    const y = Math.max(0, Math.min(30 + offset, availH - h - 20))

    const zIndex = nextZIndex++

    windows.value = [
      ...windows.value,
      {
        id: config.id,
        title: config.title,
        icon: config.icon,
        component: config.component,
        x,
        y,
        width: w,
        height: h,
        minWidth: config.minWidth ?? 300,
        minHeight: config.minHeight ?? 200,
        minimized: false,
        maximized: false,
        zIndex,
      },
    ]

    activeWindowId.value = config.id
  }

  function closeWindow(id: string): void {
    windows.value = windows.value.filter(w => w.id !== id)
    if (activeWindowId.value === id) {
      activateTopWindow()
    }
  }

  function focusWindow(id: string): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    // Direct mutation for performance (called on every click)
    win.zIndex = nextZIndex++
    activeWindowId.value = id
  }

  function minimizeWindow(id: string): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    win.minimized = true
    if (activeWindowId.value === id) {
      activateTopWindow()
    }
  }

  function toggleMaximize(id: string): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    win.maximized = !win.maximized
  }

  function restoreWindow(id: string): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    win.minimized = false
    focusWindow(id)
  }

  // Direct mutation for drag performance (called at ~60fps during drag)
  function moveWindow(id: string, x: number, y: number): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    win.x = x
    win.y = y
  }

  // Direct mutation for resize performance (called at ~60fps during resize)
  function resizeWindow(
    id: string,
    rect: { x: number, y: number, width: number, height: number },
  ): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    win.x = rect.x
    win.y = rect.y
    win.width = Math.max(win.minWidth, rect.width)
    win.height = Math.max(win.minHeight, rect.height)
  }

  function toggleMinimize(id: string): void {
    const win = windows.value.find(w => w.id === id)
    if (!win)
      return
    if (win.minimized) {
      restoreWindow(id)
    }
    else if (activeWindowId.value === id) {
      minimizeWindow(id)
    }
    else {
      focusWindow(id)
    }
  }

  function clearFocus(): void {
    activeWindowId.value = null
  }

  function activateTopWindow(): void {
    const visible = windows.value.filter(w => !w.minimized)
    if (visible.length > 0) {
      const top = visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
      activeWindowId.value = top.id
    }
    else {
      activeWindowId.value = null
    }
  }

  return {
    windows,
    activeWindowId,
    activeWindow,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleMaximize,
    restoreWindow,
    moveWindow,
    resizeWindow,
    toggleMinimize,
    clearFocus,
  }
})
