import { describe, expect, it } from 'vitest'
import {
  createItem,
  createPlan,
  duplicatePlanData,
  getItemDisplayName,
  normalizeDocument,
  sanitizeItemName,
  sanitizeItemNote,
  type WorkspaceDocument,
} from './models'

describe('device display name', () => {
  it('uses the custom trimmed name when present', () => {
    const item = { ...createItem('monitor'), name: '  主屏 34 寸 ' }
    expect(getItemDisplayName(item)).toBe('主屏 34 寸')
  })

  it('falls back to the device type label for old unnamed items', () => {
    const oldItem = createItem('lamp')
    expect(getItemDisplayName(oldItem)).toBe('桌面灯')
    expect(getItemDisplayName({ ...oldItem, name: '   ' })).toBe('桌面灯')
  })
})

describe('item text sanitizers', () => {
  it('collapses whitespace, caps length and turns empty names into undefined', () => {
    expect(sanitizeItemName('左\n  音箱 ')).toBe('左 音箱')
    expect(sanitizeItemName('   ')).toBeUndefined()
    expect(sanitizeItemName('x'.repeat(40))).toHaveLength(24)
  })

  it('trims notes, keeps inner newlines and caps length', () => {
    expect(sanitizeItemNote('第一行\n第二行 ')).toBe('第一行\n第二行')
    expect(sanitizeItemNote('   ')).toBeUndefined()
    expect(sanitizeItemNote('y'.repeat(200))).toHaveLength(120)
  })
})

describe('document normalization', () => {
  it('repairs legacy items without name or note fields without shifting positions', () => {
    const item = { ...createItem('speaker'), x: 123.4, y: 56.7 }
    const plan = createPlan('老方案', false)
    const legacy = { version: 1 as const, plans: [{ ...plan, items: [item] }], activePlanId: plan.id }
    const normalized = normalizeDocument(legacy as WorkspaceDocument)
    expect(normalized.plans[0].items[0]).toMatchObject({
      id: item.id,
      type: 'speaker',
      x: 123.4,
      y: 56.7,
    })
    expect(normalized.plans[0].items[0].name).toBeUndefined()
    expect(getItemDisplayName(normalized.plans[0].items[0])).toBe('音箱')
  })

  it('keeps valid names through normalization', () => {
    const item = { ...createItem('monitor'), name: '带鱼屏', note: '靠墙面放' }
    const plan = createPlan('新方案', false)
    const normalized = normalizeDocument({ version: 1, plans: [{ ...plan, items: [item] }], activePlanId: plan.id })
    expect(normalized.plans[0].items[0].name).toBe('带鱼屏')
    expect(normalized.plans[0].items[0].note).toBe('靠墙面放')
  })
})

describe('plan duplication', () => {
  it('carries every item name and note into the duplicated plan with fresh ids', () => {
    const named = { ...createItem('monitor', 0), name: '主屏', note: '居中' }
    const unnamed = createItem('keyboard', 1)
    const plan = { ...createPlan('原方案', false), items: [named, unnamed] }
    const copy = duplicatePlanData(plan)
    expect(copy.id).not.toBe(plan.id)
    expect(copy.name).toBe('原方案 · 副本')
    expect(copy.items).toHaveLength(2)
    expect(copy.items[0].id).not.toBe(named.id)
    expect(copy.items[0]).toMatchObject({ name: '主屏', note: '居中', type: 'monitor' })
    // 没起名字的设备复制后仍然没有自定义名字，继续靠类型名兜底
    expect(copy.items[1].name).toBeUndefined()
    expect(getItemDisplayName(copy.items[1])).toBe('键盘')
  })
})
