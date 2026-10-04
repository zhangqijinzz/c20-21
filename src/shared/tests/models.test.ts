import { describe, expect, it } from 'vitest'
import {
  createId,
  createInitialDocument,
  createItem,
  duplicatePlanItems,
  getItemDisplayName,
  normalizeItemName,
  normalizeWorkspaceDocument,
} from '../models'

describe('device naming', () => {
  it('uses the custom name when present and falls back to the type label otherwise', () => {
    const named = { ...createItem('monitor'), name: '副屏' }
    expect(getItemDisplayName(named)).toBe('副屏')
    expect(getItemDisplayName(createItem('keyboard'))).toBe('键盘')
    expect(getItemDisplayName({ ...createItem('lamp'), name: '   ' })).toBe('桌面灯')
  })

  it('treats blank names as empty so the type label fallback applies', () => {
    expect(normalizeItemName('  主屏  ')).toBe('主屏')
    expect(normalizeItemName('   ')).toBeUndefined()
    expect(normalizeItemName('x'.repeat(80))?.length).toBe(30)
  })
})

describe('plan duplication', () => {
  it('regenerates item ids but keeps names and notes attached to the devices', () => {
    const source = [{ ...createItem('monitor'), name: '带鱼屏', note: '抬升到视线高度' }, createItem('lamp')]
    const copy = duplicatePlanItems(source)
    expect(copy[0].id).not.toBe(source[0].id)
    expect(copy[0].name).toBe('带鱼屏')
    expect(copy[0].note).toBe('抬升到视线高度')
    expect(copy[1].id).not.toBe(source[1].id)
    expect(copy[1].name).toBeUndefined()
    // 不改动原数组里的设备
    expect(source[0].id).not.toBe(copy[0].id)
  })
})

describe('legacy document migration', () => {
  it('normalizes old plans whose items lack name/note without losing layout', () => {
    const legacy = {
      version: 1,
      activePlanId: 'plan-old',
      plans: [{
        id: 'plan-old',
        name: '老方案',
        deskWidthMm: 1400,
        deskHeightMm: 700,
        updatedAt: '2026-09-01T00:00:00.000Z',
        items: [{ id: 'item-old', type: 'speaker', widthMm: 160, heightMm: 160, x: 120, y: 90, rotation: 0 }],
      }],
    }
    const document = normalizeWorkspaceDocument(legacy)
    expect(document).not.toBeNull()
    const item = document!.plans[0].items[0]
    expect(item.name).toBeUndefined()
    expect(getItemDisplayName(item)).toBe('音箱')
    expect(item).toMatchObject({ id: 'item-old', widthMm: 160, x: 120, y: 90 })
  })

  it('drops blank stored names and points an invalid active plan at the first plan', () => {
    const document = normalizeWorkspaceDocument({
      version: 1,
      activePlanId: 'missing-plan',
      plans: [{ id: 'p1', name: 'P', deskWidthMm: 1600, deskHeightMm: 800, updatedAt: '', items: [{ id: 'i1', type: 'lamp', name: '   ', widthMm: 180, heightMm: 180, x: 0, y: 0, rotation: 0 }] }],
    })
    expect(document?.activePlanId).toBe('p1')
    expect(document?.plans[0].items[0].name).toBeUndefined()
  })

  it('rejects documents without any valid plans', () => {
    expect(normalizeWorkspaceDocument(null)).toBeNull()
    expect(normalizeWorkspaceDocument({ version: 1, plans: [] })).toBeNull()
    expect(normalizeWorkspaceDocument(createInitialDocument())).not.toBeNull()
    expect(createId('x').startsWith('x-')).toBe(true)
  })
})
