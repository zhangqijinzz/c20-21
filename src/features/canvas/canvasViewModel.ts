import { normalizeRotation } from '../../shared/layoutRules'
import { getItemDisplayName, type DeskItem } from '../../shared/models'

function updateCanvasItem(items: DeskItem[], id: string, updater: (item: DeskItem) => DeskItem): DeskItem[] {
  return items.map((item) => item.id === id ? updater(item) : item)
}

export function moveCanvasItem(items: DeskItem[], id: string, x: number, y: number): DeskItem[] {
  return updateCanvasItem(items, id, (item) => ({ ...item, x, y }))
}

export function rotateCanvasItem(items: DeskItem[], id: string, delta: number): DeskItem[] {
  return updateCanvasItem(items, id, (item) => ({ ...item, rotation: normalizeRotation(item.rotation + delta) }))
}

/**
 * 让设备名字在画布矩形内完整可读：空间不足时先缩字号、再按长度截断加省略号。
 * 名字缺失时已经在 getItemDisplayName 内用类型名兜底，因此这里永远不会得到空串。
 */
export function fitCanvasLabel(label: string, availableWidth: number, preferredSize: number): { text: string; fontSize: number } {
  // 先缩小字号；CJK 字形近似方块，按约 0.95em 估算可容纳字数
  const fontSize = Math.max(14, Math.min(preferredSize, availableWidth / 1.9))
  const capacity = Math.max(1, Math.floor(availableWidth / (fontSize * 0.95)))
  if (label.length <= capacity) return { text: label, fontSize }
  return { text: `${label.slice(0, Math.max(1, capacity - 1))}…`, fontSize }
}

/** 画布上每台设备的展示数据，保证老设备无名字时也用类型名兜底 */
export function getCanvasItemLabel(item: DeskItem): string {
  return getItemDisplayName(item)
}
