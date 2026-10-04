export type DeviceType = 'monitor' | 'keyboard' | 'lamp' | 'speaker' | 'stand'

export type WorkspaceStatus = 'loading' | 'ready' | 'saving' | 'error'

export interface DeskItem {
  id: string
  type: DeviceType
  /** 用户自定义名称；老方案可能没有该字段，展示时用类型名兜底 */
  name?: string
  /** 设备备注，仅在属性区和清单里辅助说明 */
  note?: string
  widthMm: number
  heightMm: number
  x: number
  y: number
  rotation: number
}

export interface WorkspacePlan {
  id: string
  name: string
  deskWidthMm: number
  deskHeightMm: number
  items: DeskItem[]
  updatedAt: string
}

export interface WorkspaceDocument {
  version: 1
  plans: WorkspacePlan[]
  activePlanId: string
}

export interface ItemBounds {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface LayoutAnalysis {
  overlapIds: string[]
  outOfBoundsIds: string[]
  coveragePercent: number
  status: 'clear' | 'attention'
}

export interface DeviceDefinition {
  type: DeviceType
  label: string
  shortLabel: string
  widthMm: number
  heightMm: number
  color: string
  hint: string
}

export const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  { type: 'monitor', label: '显示器', shortLabel: 'MON', widthMm: 540, heightMm: 210, color: '#93b7ff', hint: '主屏 / 副屏' },
  { type: 'keyboard', label: '键盘', shortLabel: 'KEY', widthMm: 440, heightMm: 150, color: '#b5ead7', hint: '全尺寸 / 75%' },
  { type: 'lamp', label: '桌面灯', shortLabel: 'LAMP', widthMm: 180, heightMm: 180, color: '#ffd58e', hint: '灯座占用' },
  { type: 'speaker', label: '音箱', shortLabel: 'SPK', widthMm: 150, heightMm: 150, color: '#f4b7d4', hint: '左右声道' },
  { type: 'stand', label: '支架', shortLabel: 'STAND', widthMm: 260, heightMm: 180, color: '#cbb7f7', hint: '支架 / 坞站' },
]

export const DEFAULT_DESK = { widthMm: 1600, heightMm: 800 }

export function getDeviceDefinition(type: DeviceType): DeviceDefinition {
  return DEVICE_DEFINITIONS.find((device) => device.type === type) ?? DEVICE_DEFINITIONS[0]
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createItem(type: DeviceType, index = 0): DeskItem {
  const definition = getDeviceDefinition(type)
  const columns = 3
  const x = 80 + (index % columns) * 280
  const y = 90 + Math.floor(index / columns) * 240
  return {
    id: createId('item'),
    type,
    widthMm: definition.widthMm,
    heightMm: definition.heightMm,
    x,
    y,
    rotation: 0,
  }
}

export function createPlan(name = '我的工作台', withDemo = true): WorkspacePlan {
  const items = withDemo ? [createItem('monitor', 0), createItem('keyboard', 1)] : []
  if (withDemo) {
    items[0].x = 530
    items[0].y = 105
    items[1].x = 580
    items[1].y = 470
  }
  return {
    id: createId('plan'),
    name,
    deskWidthMm: DEFAULT_DESK.widthMm,
    deskHeightMm: DEFAULT_DESK.heightMm,
    items,
    updatedAt: new Date().toISOString(),
  }
}

export function createInitialDocument(): WorkspaceDocument {
  const plan = createPlan('我的工作台', true)
  return { version: 1, plans: [plan], activePlanId: plan.id }
}

export const MAX_ITEM_NAME_LENGTH = 24
export const MAX_ITEM_NOTE_LENGTH = 120

/** 设备展示名：用户名字优先，为空（含老方案未命名）时用类型名兜底，绝不留白 */
export function getItemDisplayName(item: Pick<DeskItem, 'name' | 'type'>): string {
  const customName = item.name?.trim()
  return customName ? customName : getDeviceDefinition(item.type).label
}

function hasCustomName(name: unknown): name is string {
  return typeof name === 'string' && name.trim().length > 0
}

/** 清理用户输入的名称：去掉换行、压缩首尾空白、限长；清空后返回 undefined 以便回落到类型名 */
export function sanitizeItemName(name: string): string | undefined {
  const compacted = name.replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_NAME_LENGTH)
  return compacted.length > 0 ? compacted : undefined
}

/** 清理备注：保留内部换行，去掉首尾空白并限长 */
export function sanitizeItemNote(note: string): string | undefined {
  const trimmed = note.trim().slice(0, MAX_ITEM_NOTE_LENGTH)
  return trimmed.length > 0 ? trimmed : undefined
}

/** 老方案里的设备没有 name/note 字段，统一规整为合法字符串字段，避免空白或错位 */
export function normalizeItem(item: DeskItem): DeskItem {
  return {
    ...item,
    name: hasCustomName(item.name) ? sanitizeItemName(item.name) : undefined,
    note: typeof item.note === 'string' && item.note.trim().length > 0 ? item.note.trim().slice(0, MAX_ITEM_NOTE_LENGTH) : undefined,
  }
}

export function normalizeDocument(document: WorkspaceDocument): WorkspaceDocument {
  return { ...document, plans: document.plans.map((plan) => ({ ...plan, items: plan.items.map(normalizeItem) })) }
}

/** 复制方案：生成新的方案/设备 id，但保留每件设备的名字与备注 */
export function duplicatePlanData(plan: WorkspacePlan): WorkspacePlan {
  return {
    ...plan,
    id: createId('plan'),
    name: `${plan.name} · 副本`,
    items: plan.items.map((item) => ({ ...normalizeItem(item), id: createId('item') })),
    updatedAt: new Date().toISOString(),
  }
}
