import { describe, expect, it } from 'vitest'
import { createItem, createPlan } from '../../../shared/models'
import { buildInventoryRows, describeItemIssue, inspectPlan } from '../inspectionViewModel'

describe('device inventory rows', () => {
  it('builds a row per item with name fallback, rounded position and issue summary', () => {
    const plan = createPlan('清单', false)
    const first = { ...createItem('monitor'), name: '主屏', x: 100.2, y: 50.8 }
    const second = { ...createItem('keyboard'), x: 100, y: 50 }
    const outside = { ...createItem('lamp'), x: 1500, y: 700 }
    const withItems = { ...plan, items: [first, second, outside] }
    const { analysis } = inspectPlan(withItems)
    const rows = buildInventoryRows(withItems, analysis)

    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      id: first.id,
      name: '主屏',
      typeLabel: '显示器',
      widthMm: first.widthMm,
      heightMm: first.heightMm,
      x: 100,
      y: 51,
    })
    // 老设备没有名字，行内名称直接用类型名，不留空白
    expect(rows[1].name).toBe('键盘')
    expect(rows[0].issueLabel).toBe('与其他设备重叠')
    expect(rows[2].issueLabel).toBe('超出桌面边界')
  })

  it('marks healthy items with a null issue label', () => {
    const plan = createPlan('清单', false)
    const item = { ...createItem('monitor'), x: 0, y: 0 }
    const { analysis } = inspectPlan({ ...plan, items: [item] })
    expect(describeItemIssue(item.id, analysis)).toBeNull()
    expect(buildInventoryRows({ ...plan, items: [item] }, analysis)[0].issueLabel).toBeNull()
  })
})
