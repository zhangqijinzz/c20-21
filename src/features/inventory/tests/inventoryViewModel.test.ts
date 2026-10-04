import { describe, expect, it } from 'vitest'
import { createItem, createPlan } from '../../../shared/models'
import { buildDeviceInventory } from '../inventoryViewModel'

describe('inventory module', () => {
  it('falls back to the device type label when an old item has no name', () => {
    const plan = createPlan('清单', false)
    const legacy = createItem('monitor')
    delete legacy.name
    const inventory = buildDeviceInventory({ ...plan, items: [legacy] }, { overlapIds: [], outOfBoundsIds: [], coveragePercent: 0, status: 'clear' })
    expect(inventory.rows[0].name).toBe('显示器')
    expect(inventory.rows[0].isCustomName).toBe(false)
  })

  it('exposes name, type, dimensions, position and issue state for every item', () => {
    const plan = createPlan('清单', false)
    const first = { ...createItem('monitor'), name: '主屏 27 寸', note: '居中摆放', x: 0, y: 0 }
    const second = { ...createItem('keyboard'), x: 10, y: 10 }
    const inventory = buildDeviceInventory(
      { ...plan, items: [first, second] },
      { overlapIds: [first.id, second.id], outOfBoundsIds: [first.id], coveragePercent: 20, status: 'attention' },
    )
    expect(inventory.totalCount).toBe(2)
    expect(inventory.issueCount).toBe(2)
    expect(inventory.rows[0]).toMatchObject({
      id: first.id,
      name: '主屏 27 寸',
      isCustomName: true,
      typeLabel: '显示器',
      widthMm: first.widthMm,
      heightMm: first.heightMm,
      x: 0,
      y: 0,
      note: '居中摆放',
      hasIssue: true,
      issueLabel: '重叠 · 越界',
    })
    expect(inventory.rows[1].name).toBe('键盘')
    expect(inventory.rows[1].issueLabel).toBe('与其他设备重叠')
    // 行顺序与画布 items 一致
    expect(inventory.rows.map((row) => row.id)).toEqual([first.id, second.id])
  })
})
