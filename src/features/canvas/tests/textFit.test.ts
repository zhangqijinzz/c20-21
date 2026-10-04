import { describe, expect, it } from 'vitest'
import { fitSvgText } from '../textFit'

describe('fitSvgText', () => {
  it('keeps short text untouched', () => {
    expect(fitSvgText('显示器', 200, 20)).toBe('显示器')
  })

  it('truncates long labels with an ellipsis instead of overflowing the device', () => {
    const fitted = fitSvgText('这是一个非常非常长的设备名称', 100, 20)
    expect(fitted.endsWith('…')).toBe(true)
    expect(fitted.length).toBeLessThan('这是一个非常非常长的设备名称'.length)
  })

  it('returns an empty string when even the ellipsis cannot fit', () => {
    expect(fitSvgText('显示器', 2, 20)).toBe('')
  })
})
