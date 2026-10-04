import { analyzeLayout } from '../../shared/layoutRules'
import { getDeviceDefinition, getItemDisplayName, type DeskItem, type LayoutAnalysis, type WorkspacePlan } from '../../shared/models'

export interface InspectionState {
  analysis: LayoutAnalysis
  issueIds: string[]
  issueCount: number
}

export function inspectPlan(plan: WorkspacePlan): InspectionState {
  const analysis = analyzeLayout(plan)
  const issueIds = [...new Set([...analysis.overlapIds, ...analysis.outOfBoundsIds])]
  return { analysis, issueIds, issueCount: issueIds.length }
}

export interface InventoryRow {
  id: string
  name: string
  typeLabel: string
  typeShortLabel: string
  color: string
  widthMm: number
  heightMm: number
  x: number
  y: number
  issueLabel: string | null
}

/** 单台设备的问题描述：同时越界和重叠时优先提示越界 */
export function describeItemIssue(itemId: string, analysis: LayoutAnalysis): string | null {
  if (analysis.outOfBoundsIds.includes(itemId)) return '超出桌面边界'
  if (analysis.overlapIds.includes(itemId)) return '与其他设备重叠'
  return null
}

/** 生成方案设备清单的一行行数据；无名字的老设备用类型名兜底 */
export function buildInventoryRows(plan: WorkspacePlan, analysis: LayoutAnalysis): InventoryRow[] {
  return plan.items.map((item: DeskItem) => {
    const definition = getDeviceDefinition(item.type)
    return {
      id: item.id,
      name: getItemDisplayName(item),
      typeLabel: definition.label,
      typeShortLabel: definition.shortLabel,
      color: definition.color,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      x: Math.round(item.x),
      y: Math.round(item.y),
      issueLabel: describeItemIssue(item.id, analysis),
    }
  })
}
