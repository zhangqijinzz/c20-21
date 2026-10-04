import { Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { LayoutAnalysis, WorkspacePlan } from '../../../shared/models'
import { CanvasStage } from '../../canvas/components/CanvasStage'
import { buildDeviceInventory } from '../../inventory/inventoryViewModel'

interface PreviewOverlayProps {
  plan: WorkspacePlan
  analysis: LayoutAnalysis
  issueCount: number
  onClose: () => void
}

export function PreviewOverlay({ plan, analysis, issueCount, onClose }: PreviewOverlayProps) {
  const inventory = buildDeviceInventory(plan, analysis)
  return (
    <div className="preview-backdrop" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <section className="preview-modal">
        <header className="preview-modal-header"><div><span className="eyebrow">LAYOUT PREVIEW</span><h2 id="preview-title">{plan.name}</h2><p>{plan.deskWidthMm} × {plan.deskHeightMm} mm · {plan.items.length} 件设备</p></div><button className="close-preview" aria-label="关闭预览" onClick={onClose} type="button"><X size={18} /></button></header>
        <div className="preview-canvas"><CanvasStage plan={plan} selectedItemId={null} analysis={analysis} onSelect={() => undefined} onMove={() => undefined} /></div>
        <div className="preview-inventory">
          <div className="preview-inventory-head"><strong>设备清单</strong><span>{inventory.totalCount} 件 · {inventory.issueCount === 0 ? '全部正常' : `${inventory.issueCount} 件有问题`}</span></div>
          {inventory.rows.length === 0 ? (
            <p className="preview-inventory-empty">方案里还没有设备</p>
          ) : (
            <ul className="preview-inventory-list">
              {inventory.rows.map((row) => (
                <li className={`preview-inventory-item ${row.hasIssue ? 'has-issue' : ''}`} key={row.id}>
                  <i className="inventory-swatch" style={{ backgroundColor: row.color }} />
                  <span className="preview-item-name">{row.name}</span>
                  <span className="preview-item-type">{row.typeLabel}</span>
                  <span className="preview-item-meta">{row.widthMm} × {row.heightMm} mm</span>
                  <span className="preview-item-meta">X {row.x} / Y {row.y}</span>
                  <span className={`inventory-status ${row.hasIssue ? 'status-bad' : 'status-ok'}`}>{row.hasIssue ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}{row.issueLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="preview-footer"><span className="preview-check"><Check size={15} /> {issueCount === 0 ? '布局检查通过，可开始搭建' : `还有 ${issueCount} 个位置需要调整`}</span><button className="preview-done" onClick={onClose} type="button">返回编辑</button></footer>
      </section>
    </div>
  )
}
