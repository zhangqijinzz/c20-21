import { describe, expect, it } from 'vitest'
import { createItem } from '../../../shared/models'
import { fitCanvasLabel, getCanvasItemLabel, moveCanvasItem, rotateCanvasItem } from '../canvasViewModel'

describe('canvas module', () => {
  it('moves and rotates the requested item without changing other items', () => {
    const first = createItem('monitor')
    const second = createItem('keyboard')
    const moved = moveCanvasItem([first, second], first.id, 320, 180)
    const rotated = rotateCanvasItem(moved, first.id, -15)
    expect(rotated[0]).toMatchObject({ x: 320, y: 180, rotation: 345 })
    expect(rotated[1]).toEqual(second)
  })

  it('falls back to the type label on canvas for unnamed items', () => {
    expect(getCanvasItemLabel(createItem('stand'))).toBe('支架')
    expect(getCanvasItemLabel({ ...createItem('stand'), name: '副屏支架' })).toBe('副屏支架')
  })

  it('fits short labels unchanged at the preferred size', () => {
    expect(fitCanvasLabel('主屏', 500, 32)).toEqual({ text: '主屏', fontSize: 32 })
  })

  it('truncates long labels that cannot fit at the preferred size', () => {
    const result = fitCanvasLabel('左侧环绕音箱', 120, 32)
    expect(result.fontSize).toBe(32)
    expect(result.text.endsWith('…')).toBe(true)
    expect(result.text.length).toBeLessThan('左侧环绕音箱'.length)
  })

  it('shrinks font size for very narrow items', () => {
    const result = fitCanvasLabel('支架', 30, 32)
    expect(result.fontSize).toBeLessThan(32)
    expect(result.fontSize).toBeGreaterThanOrEqual(14)
  })

  it('never returns an empty label even for extremely narrow items', () => {
    const result = fitCanvasLabel('任意名称', 10, 32)
    expect(result.text.length).toBeGreaterThan(0)
    expect(result.fontSize).toBe(14)
  })
})
