export interface AppConfig {
  id: string
  title: string
  icon: string
  component: string
  width: number
  height: number
  minWidth: number
  minHeight: number
}

export const APP_REGISTRY: readonly AppConfig[] = [
  {
    id: 'chat',
    title: 'ChainChat - Broadcast',
    icon: 'message-text',
    component: 'chat',
    width: 800,
    height: 520,
    minWidth: 500,
    minHeight: 300,
  },
  {
    id: 'explorer',
    title: 'Block Explorer',
    icon: 'blocks',
    component: 'explorer',
    width: 820,
    height: 580,
    minWidth: 500,
    minHeight: 350,
  },
  {
    id: 'network',
    title: 'Network Topology',
    icon: 'globe',
    component: 'network',
    width: 750,
    height: 550,
    minWidth: 500,
    minHeight: 350,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings-cog',
    component: 'settings',
    width: 500,
    height: 400,
    minWidth: 350,
    minHeight: 280,
  },
  {
    id: 'about',
    title: 'About ChainChat',
    icon: 'info-box',
    component: 'about',
    width: 360,
    height: 240,
    minWidth: 300,
    minHeight: 200,
  },
] as const

export const APP_MAP = new Map(APP_REGISTRY.map(app => [app.id, app]))

export function getAppConfig(id: string): AppConfig | undefined {
  return APP_MAP.get(id)
}
