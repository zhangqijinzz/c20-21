import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { createItem, createPlan } from '../../../shared/models'
import { CanvasStage } from '../components/CanvasStage'
import { buildDeviceInventory } from '../../inventory/inventoryViewModel'
import { InventoryPanel } from '../../inventory/components/InventoryPanel'

const clearAnalysis = { overlapIds: [], outOfBoundsIds: [], coveragePercent: 0, status: 'clear' as const }
/** SSR 在相邻 JSX 表达式之间插入注释节点，断言前统一去掉 */
const stripSsrMarkers = (html: string) => html.replace(/<!--[^>]*-->/g, '')

describe('canvas rendering', () => {
  it('draws the custom name on the device and the type label for legacy unnamed items', () => {
    const plan = createPlan('渲染', false)
    const named = { ...createItem('monitor', 0), name: '我的主屏', x: 100, y: 100 }
    const legacy = createItem('keyboard', 1)
    delete legacy.name
    const html = stripSsrMarkers(renderToString(
      <CanvasStage
        plan={{ ...plan, items: [named, legacy] }}
        selectedItemId={null}
        analysis={clearAnalysis}
        onSelect={() => undefined}
        onMove={() => undefined}
      />,
    ))
    expect(html).toContain('我的主屏')
    expect(html).toContain('键盘')
    expect(html).toContain('540 × 210')
    expect(html).toContain('aria-label="我的主屏（显示器），540乘210毫米"')
    expect(html).toContain('aria-label="键盘，440乘150毫米"')
  })

  it('marks the located item with the focus highlight', () => {
    const plan = createPlan('渲染', false)
    const item = createItem('lamp', 0)
    const html = renderToString(
      <CanvasStage plan={{ ...plan, items: [item] }} selectedItemId={null} focusedItemId={item.id} analysis={clearAnalysis} onSelect={() => undefined} onMove={() => undefined} />,
    )
    expect(html).toContain('is-focused')
    expect(html).toContain('focus-box')
  })
})

describe('inventory panel rendering', () => {
  it('renders one editable row per item with type name as placeholder for unnamed items', () => {
    const plan = createPlan('渲染', false)
    const named = { ...createItem('speaker'), name: '左声道', x: 40, y: 50 }
    const legacy = createItem('stand')
    delete legacy.name
    const inventory = buildDeviceInventory({ ...plan, items: [named, legacy] }, clearAnalysis)
    const html = stripSsrMarkers(renderToString(
      <InventoryPanel inventory={inventory} selectedItemId={null} focusedItemId={null} onLocate={() => undefined} onRename={() => undefined} />,
    ))
    expect(html).toContain('左声道')
    expect(html).toContain('placeholder="支架"')
    expect(html).toContain('X 40 / Y 50')
    expect(html).toContain('正常')
  })
})
