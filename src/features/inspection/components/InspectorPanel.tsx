import { AlertTriangle, Crosshair, RotateCcw, RotateCw, Ruler, Trash2 } from 'lucide-react'
import type { DeskItem, WorkspacePlan } from '../../../shared/models'
import { getDeviceDefinition, getItemDisplayName, MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../shared/models'

interface InspectorPanelProps {
  plan: WorkspacePlan
  item: DeskItem | null
  issueIds: string[]
  onUpdateDesk: (field: 'deskWidthMm' | 'deskHeightMm', value: number) => void
  onUpdateItem: (id: string, patch: Partial<Pick<DeskItem, 'widthMm' | 'heightMm' | 'x' | 'y'>>) => void
  onRenameItem: (id: string, name: string) => void
  onUpdateNote: (id: string, note: string) => void
  onRotate: (id: string, delta: number) => void
  onDelete: (id: string) => void
}

function NumericField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="numeric-field"><span>{label}</span><input type="number" value={value} min={40} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} /><em>mm</em></label>
}

export function InspectorPanel({ plan, item, issueIds, onUpdateDesk, onUpdateItem, onRenameItem, onUpdateNote, onRotate, onDelete }: InspectorPanelProps) {
  const isIssue = item ? issueIds.includes(item.id) : false
  const definition = item ? getDeviceDefinition(item.type) : null
  const displayName = item ? getItemDisplayName(item) : ''
  return (
    <aside className="inspector-panel">
      <div className="module-heading">
        <div><span className="eyebrow">02 / 检查</span><h2>尺寸检查</h2></div>
        <Ruler size={18} className="muted-icon" />
      </div>
      <div className="desk-size-card">
        <div className="field-heading"><span>桌面画布</span><span className="field-status">实时</span></div>
        <div className="desk-size-fields">
          <NumericField label="宽度" value={plan.deskWidthMm} onChange={(value) => onUpdateDesk('deskWidthMm', value)} />
          <NumericField label="深度" value={plan.deskHeightMm} onChange={(value) => onUpdateDesk('deskHeightMm', value)} />
        </div>
        <p className="helper-text">建议保留 40 mm 走线缓冲空间</p>
      </div>
      {item && definition ? (
        <div className="item-editor">
          <div className="selected-item-heading"><span className="selected-swatch" style={{ backgroundColor: definition.color }} /> <div><strong>{displayName}</strong><small>{definition.label} · {definition.hint}</small></div><span className="item-code">{definition.shortLabel}</span></div>
          {isIssue && <div className="issue-callout"><AlertTriangle size={16} /><span>设备与其他元素重叠或超出桌面边界</span></div>}
          <label className="profile-field">
            <span className="field-heading"><span>设备名称</span><span className="unit-label">留空显示「{definition.label}」</span></span>
            <input
              type="text"
              className="text-field"
              defaultValue={item.name ?? ''}
              key={`name-${item.id}-${item.name ?? ''}`}
              maxLength={MAX_ITEM_NAME_LENGTH}
              placeholder={definition.label}
              onBlur={(event) => onRenameItem(item.id, event.currentTarget.value)}
            />
          </label>
          <label className="profile-field">
            <span className="field-heading"><span>备注</span><span className="unit-label">{MAX_ITEM_NOTE_LENGTH} 字内</span></span>
            <textarea
              className="text-field note-field"
              defaultValue={item.note ?? ''}
              key={`note-${item.id}-${item.note ?? ''}`}
              maxLength={MAX_ITEM_NOTE_LENGTH}
              rows={2}
              placeholder="例如：左声道 / 34 寸带鱼屏 / 需要靠近插座"
              onBlur={(event) => onUpdateNote(item.id, event.currentTarget.value)}
            />
          </label>
          <div className="field-heading"><span>实际尺寸</span><span className="unit-label">单位：毫米</span></div>
          <div className="two-column-fields">
            <NumericField label="宽度" value={item.widthMm} onChange={(value) => onUpdateItem(item.id, { widthMm: value })} />
            <NumericField label="深度" value={item.heightMm} onChange={(value) => onUpdateItem(item.id, { heightMm: value })} />
          </div>
          <div className="field-heading position-heading"><span>位置</span><span className="unit-label">左上角坐标</span></div>
          <div className="two-column-fields">
            <NumericField label="X" value={Math.round(item.x)} onChange={(value) => onUpdateItem(item.id, { x: value })} />
            <NumericField label="Y" value={Math.round(item.y)} onChange={(value) => onUpdateItem(item.id, { y: value })} />
          </div>
          <div className="rotation-row"><span><Crosshair size={15} /> 旋转角度 <strong>{Math.round(item.rotation)}°</strong></span><div className="rotation-actions"><button aria-label="逆时针旋转 15 度" onClick={() => onRotate(item.id, -15)} type="button"><RotateCcw size={15} /></button><button aria-label="顺时针旋转 15 度" onClick={() => onRotate(item.id, 15)} type="button"><RotateCw size={15} /></button></div></div>
          <button className="remove-item-button" onClick={() => onDelete(item.id)} type="button"><Trash2 size={15} /> 移除这个设备</button>
        </div>
      ) : (
        <div className="empty-inspector"><span className="empty-illustration">⌖</span><strong>选择一个设备</strong><p>点击画布或下方清单中的设备，查看名称、备注、尺寸和位置控制。</p></div>
      )}
    </aside>
  )
}
