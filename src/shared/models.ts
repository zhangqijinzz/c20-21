export type DeviceType = 'monitor' | 'keyboard' | 'lamp' | 'speaker' | 'stand'

export type WorkspaceStatus = 'loading' | 'ready' | 'saving' | 'error'

export interface DeskItem {
  id: string
  type: DeviceType
  name?: string
  note?: string
  widthMm: number
  heightMm: number
  x: number
  y: number
  rotation: number
}

/** 允许的设备名称 / 备注最大长度 */
export const MAX_ITEM_NAME_LENGTH = 30
export const MAX_ITEM_NOTE_LENGTH = 120

/**
 * 设备的显示名：优先使用用户起的名字，旧方案没有名字时用类型名兜底，
 * 任何调用方都不会拿到空白字符串。
 */
export function getItemDisplayName(item: Pick<DeskItem, 'type' | 'name'>): string {
  const customName = item.name?.trim()
  return customName ? customName : getDeviceDefinition(item.type).label
}

/** 名称是否为用户自定义（未填写时返回 false，交给类型名兜底） */
export function hasCustomName(item: Pick<DeskItem, 'name'>): boolean {
  return Boolean(item.name?.trim())
}

/**
 * 规整用户输入的设备名：去掉首尾空白，清空时返回 undefined，
 * 这样后续显示会自动回落到类型名，不会存下空白名字。
 */
export function normalizeItemName(value: string): string | undefined {
  const trimmed = value.trim().slice(0, MAX_ITEM_NAME_LENGTH)
  return trimmed.length > 0 ? trimmed : undefined
}

export function normalizeItemNote(value: string): string | undefined {
  const trimmed = value.trim().slice(0, MAX_ITEM_NOTE_LENGTH)
  return trimmed.length > 0 ? trimmed : undefined
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

/**
 * 复制方案时逐件深拷贝设备并重新生成 id；
 * name / note 是设备自身数据，必须原样跟着设备走到新方案。
 */
export function duplicatePlanItems(items: DeskItem[]): DeskItem[] {
  return items.map((item) => ({ ...item, id: createId('item'), name: item.name, note: item.note }))
}

/**
 * 兼容旧方案数据：补全老版本缺失的字段，空白名字交给类型名兜底，
 * 保证画布、属性区、清单永远不会出现空白或错位。
 */
export function normalizeDeskItem(raw: Partial<DeskItem> & { id?: unknown; type?: unknown }): DeskItem | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.id !== 'string' || DEVICE_DEFINITIONS.every((device) => device.type !== raw.type)) return null
  const type = raw.type as DeviceType
  const definition = getDeviceDefinition(type)
  const finite = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return {
    id: raw.id,
    type,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, MAX_ITEM_NAME_LENGTH) : undefined,
    note: typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim().slice(0, MAX_ITEM_NOTE_LENGTH) : undefined,
    widthMm: finite(raw.widthMm, definition.widthMm),
    heightMm: finite(raw.heightMm, definition.heightMm),
    x: finite(raw.x, 0),
    y: finite(raw.y, 0),
    rotation: finite(raw.rotation, 0),
  }
}

export function normalizeWorkspaceDocument(raw: unknown): WorkspaceDocument | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Partial<WorkspaceDocument>
  if (candidate.version !== 1 || !Array.isArray(candidate.plans)) return null
  const plans = candidate.plans.flatMap((plan) => {
    if (!plan || typeof plan !== 'object' || typeof plan.id !== 'string') return []
    const items = Array.isArray(plan.items) ? plan.items.flatMap((item) => {
      const normalized = normalizeDeskItem(item as Partial<DeskItem>)
      return normalized ? [normalized] : []
    }) : []
    return [{
      id: plan.id,
      name: typeof plan.name === 'string' && plan.name.trim() ? plan.name : '未命名方案',
      deskWidthMm: typeof plan.deskWidthMm === 'number' ? plan.deskWidthMm : DEFAULT_DESK.widthMm,
      deskHeightMm: typeof plan.deskHeightMm === 'number' ? plan.deskHeightMm : DEFAULT_DESK.heightMm,
      items,
      updatedAt: typeof plan.updatedAt === 'string' ? plan.updatedAt : new Date().toISOString(),
    } satisfies WorkspacePlan]
  })
  if (plans.length === 0) return null
  const activePlanId = typeof candidate.activePlanId === 'string' && plans.some((plan) => plan.id === candidate.activePlanId)
    ? candidate.activePlanId
    : plans[0].id
  return { version: 1, plans, activePlanId }
}
