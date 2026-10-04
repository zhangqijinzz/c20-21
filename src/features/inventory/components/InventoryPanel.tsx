import { AlertTriangle, CheckCircle2, Crosshair, ListChecks } from 'lucide-react'
import type { DeviceInventory } from '../inventoryViewModel'
import { MAX_ITEM_NAME_LENGTH } from '../../../shared/models'

interface InventoryPanelProps {
  inventory: DeviceInventory
  selectedItemId: string | null
  focusedItemId: string | null
  onLocate: (id: string) => void
  onRename: (id: string, name: string) => void
}

export function InventoryPanel({ inventory, selectedItemId, focusedItemId, onLocate, onRename }: InventoryPanelProps) {
  return (
    <section className="module-panel inventory-panel" aria-labelledby="inventory-title">
      <div className="module-heading">
        <div>
          <span className="eyebrow">03 / 清单</span>
          <h2 id="inventory-title">设备清单</h2>
        </div>
        <span className="inventory-summary">
          {inventory.totalCount} 件{inventory.issueCount > 0 && <em className="inventory-issue-count">{inventory.issueCount} 个问题</em>}
        </span>
      </div>
      <p className="panel-description">点击任意一行定位到画布上的对应设备，也可以直接在这里改名字。</p>
      {inventory.rows.length === 0 ? (
        <div className="inventory-empty"><ListChecks size={20} /><span>方案里还没有设备，先从左侧素材区添加吧。</span></div>
      ) : (
        <div className="inventory-table" role="table" aria-label="方案设备清单">
          <div className="inventory-row inventory-row-head" role="row">
            <span role="columnheader">名称</span>
            <span role="columnheader">类型</span>
            <span role="columnheader">尺寸 (mm)</span>
            <span role="columnheader">位置 (mm)</span>
            <span role="columnheader">状态</span>
            <span role="columnheader">备注</span>
          </div>
          {inventory.rows.map((row, index) => (
            <div
              className={`inventory-row ${row.id === selectedItemId ? 'is-selected' : ''} ${row.id === focusedItemId ? 'is-focused' : ''} ${row.hasIssue ? 'has-issue' : ''}`}
              key={row.id}
              role="row"
              onClick={() => onLocate(row.id)}
            >
              <span className="inventory-name-cell" role="cell">
                <i className="inventory-swatch" style={{ backgroundColor: row.color }} />
                <input
                  className="inventory-name-input"
                  value={row.isCustomName ? row.name : ''}
                  placeholder={row.name}
                  maxLength={MAX_ITEM_NAME_LENGTH}
                  aria-label={`${row.typeLabel}名称`}
                  onChange={(event) => onRename(row.id, event.currentTarget.value)}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                />
                <Crosshair size={13} className="inventory-locate-icon" aria-label="定位到画布" />
              </span>
              <span className="inventory-type-cell" role="cell">
                <strong>{row.typeLabel}</strong>
                <small>#{String(index + 1).padStart(2, '0')} · {row.shortLabel}</small>
              </span>
              <span className="inventory-mono-cell" role="cell">{row.widthMm} × {row.heightMm}{row.rotation !== 0 ? ` · ${row.rotation}°` : ''}</span>
              <span className="inventory-mono-cell" role="cell">X {row.x} / Y {row.y}</span>
              <span className={`inventory-status ${row.hasIssue ? 'status-bad' : 'status-ok'}`} role="cell">
                {row.hasIssue ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                {row.issueLabel}
              </span>
              <span className="inventory-note-cell" role="cell" title={row.note}>{row.note || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
