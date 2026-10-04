/**
 * 估算文字在 SVG 中需要的宽度（em 单位）。
 * 中文 / 全角字符按 1em 计算，拉丁字符按 0.6em 估算，足够用于画布截断。
 */
function measureTextEm(text: string): number {
  let width = 0
  for (const char of text) {
    width += char.codePointAt(0)! > 0x2e7f ? 1 : 0.6
  }
  return width
}

/**
 * 把文字截断到指定宽度内，放不下时以省略号收尾。
 * 用于画布设备：名字再长也不能撑破设备框或压到尺寸数字。
 */
export function fitSvgText(text: string, maxWidthMm: number, fontSizeMm: number): string {
  if (fontSizeMm <= 0 || measureTextEm(text) * fontSizeMm <= maxWidthMm) return text
  const ellipsis = '…'
  const budget = maxWidthMm / fontSizeMm - measureTextEm(ellipsis)
  if (budget <= 0) return ''
  let result = ''
  let used = 0
  for (const char of text) {
    const advance = char.codePointAt(0)! > 0x2e7f ? 1 : 0.6
    if (used + advance > budget) break
    result += char
    used += advance
  }
  return `${result}${ellipsis}`
}
