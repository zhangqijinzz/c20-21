import type { DeskItem, DeviceType, LayoutAnalysis, WorkspacePlan } from '../../shared/models'
import { getDeviceDefinition, getItemDisplayName } from '../../shared/models'

export type InventoryIssueKind = 'overlap' | 'outOfBounds'

export interface InventoryRow {
  id: string
  /** 设备显示名：用户起名用名字，旧设备没名字用类型名，永不为空 */
  name: string
  /** 是否为用户自定义名称（清单输入框空白时以类型名作 placeholder 兜底） */
  isCustomName: boolean
  type: DeviceType
  typeLabel: string
  shortLabel: string
  color: string
  widthMm: number
  heightMm: number
  x: number
  y: number
  rotation: number
  note: string
  issues: InventoryIssueKind[]
  hasIssue: boolean
  issueLabel: string
}

export interface DeviceInventory {
  rows: InventoryRow[]
  totalCount: number
  issueCount: number
}

function describeIssues(issues: InventoryIssueKind[]): string {
  const overlap = issues.includes('overlap')
  const outOfBounds = issues.includes('outOfBounds')
  if (overlap && outOfBounds) return '重叠 · 越界'
  if (overlap) return '与其他设备重叠'
  if (outOfBounds) return '超出桌面边界'
  return '正常'
}

/**
 * 汇总方案里的全部设备，供编辑页清单 / 预览清单共用：
 * 名称、类型、尺寸、位置、问题状态都在同一处计算，保证各处口径一致。
 * 行顺序与画布 items 保持一致。
 */
export function buildDeviceInventory(plan: WorkspacePlan, analysis: LayoutAnalysis): DeviceInventory {
  const rows: InventoryRow[] = plan.items.map((item: DeskItem): InventoryRow => {
    const definition = getDeviceDefinition(item.type)
    const issues: InventoryIssueKind[] = []
    if (analysis.overlapIds.includes(item.id)) issues.push('overlap')
    if (analysis.outOfBoundsIds.includes(item.id)) issues.push('outOfBounds')
    return {
      id: item.id,
      name: getItemDisplayName(item),
      isCustomName: Boolean(item.name?.trim()),
      type: item.type,
      typeLabel: definition.label,
      shortLabel: definition.shortLabel,
      color: definition.color,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      x: Math.round(item.x),
      y: Math.round(item.y),
      rotation: Math.round(item.rotation),
      note: item.note ?? '',
      issues,
      hasIssue: issues.length > 0,
      issueLabel: describeIssues(issues),
    }
  })
  return {
    rows,
    totalCount: plan.items.length,
    issueCount: rows.filter((row) => row.hasIssue).length,
  }
}
