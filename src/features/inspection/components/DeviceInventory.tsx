import { ListChecks } from 'lucide-react'
import type { InventoryRow } from '../inspectionViewModel'
import { MAX_ITEM_NAME_LENGTH } from '../../../shared/models'

interface DeviceInventoryProps {
  rows: InventoryRow[]
  selectedItemId: string | null
  /** 预览模式：只展示、不改名，点条目仍然联动选中 */
  readOnly?: boolean
  onSelect: (id: string) => void
  onRename?: (id: string, name: string) => void
}

export function DeviceInventory({ rows, selectedItemId, readOnly = false, onSelect, onRename }: DeviceInventoryProps) {
  const commitRename = (id: string, value: string, fallback: string, input: HTMLInputElement) => {
    const nextValue = value.trim()
    if (!onRename || nextValue === fallback) {
      input.value = fallback
      return
    }
    onRename(id, nextValue)
  }

  return (
    <section className="module-panel inventory-panel" aria-labelledby="inventory-title">
      <div className="module-heading">
        <div>
          <span className="eyebrow">03 / 清单</span>
          <h2 id="inventory-title">设备清单</h2>
        </div>
        <span className="module-count">{rows.length}</span>
      </div>
      <p className="panel-description">{readOnly ? '预览模式下只读；点击条目可在上方画布查看对应设备。' : '点击一条即可定位到画布；名称可以直接在清单里修改，留空时显示设备类型。'}</p>
      {rows.length === 0 ? (
        <div className="inventory-empty"><ListChecks size={16} /><span>还没有设备，从左侧素材添加后会出现在这里。</span></div>
      ) : (
        <div className="inventory-table" role="table" aria-label="方案内全部设备清单">
          <div className="inventory-row inventory-row-head" role="row">
            <span role="columnheader">名称</span>
            <span role="columnheader">类型</span>
            <span role="columnheader">尺寸</span>
            <span role="columnheader">位置</span>
            <span role="columnheader">状态</span>
          </div>
          {rows.map((row, index) => {
            const isActive = row.id === selectedItemId
            return (
              <div
                className={`inventory-row ${isActive ? 'is-active' : ''}`}
                role="row"
                key={row.id}
                onClick={() => onSelect(row.id)}
              >
                <div className="inventory-name-cell" role="cell">
                  <span className="inventory-index">{String(index + 1).padStart(2, '0')}</span>
                  {readOnly ? (
                    <strong className="inventory-name-text" title={row.name}>{row.name}</strong>
                  ) : (
                    <input
                      key={row.name}
                      className="inventory-name-input"
                      type="text"
                      defaultValue={row.name}
                      maxLength={MAX_ITEM_NAME_LENGTH}
                      placeholder={row.typeLabel}
                      aria-label={`修改${row.typeLabel}的名称`}
                      title="点击修改名称，留空则显示类型名"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur()
                      }}
                      onBlur={(event) => commitRename(row.id, event.currentTarget.value, row.name, event.currentTarget)}
                    />
                  )}
                </div>
                <span className="inventory-type" role="cell"><i style={{ backgroundColor: row.color }} />{row.typeLabel}</span>
                <span className="inventory-dim" role="cell">{row.widthMm} × {row.heightMm}<small>mm</small></span>
                <span className="inventory-pos" role="cell">x {row.x} · y {row.y}<small>mm</small></span>
                <span className={`inventory-status ${row.issueLabel ? 'has-issue' : 'is-clear'}`} role="cell">{row.issueLabel ?? '正常'}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
