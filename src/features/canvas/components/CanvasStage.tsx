import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Move, RotateCw } from 'lucide-react'
import { getDeviceDefinition, type DeskItem, type LayoutAnalysis, type WorkspacePlan } from '../../../shared/models'
import { getItemBounds } from '../../../shared/layoutRules'
import { fitCanvasLabel, getCanvasItemLabel } from '../canvasViewModel'

interface CanvasStageProps {
  plan: WorkspacePlan
  selectedItemId: string | null
  analysis: LayoutAnalysis
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  /** 从设备清单定位时变化，触发滚动到可见区域和高亮闪烁 */
  locateSignal?: { id: string; tick: number } | null
}

interface DragState { id: string; offsetX: number; offsetY: number }

export function CanvasStage({ plan, selectedItemId, analysis, onSelect, onMove, locateSignal = null }: CanvasStageProps) {
  const stageRef = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const scaleToMm = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: ((clientX - rect.left) / rect.width) * plan.deskWidthMm, y: ((clientY - rect.top) / rect.height) * plan.deskHeightMm }
  }, [plan.deskHeightMm, plan.deskWidthMm])

  useEffect(() => {
    if (!drag) return
    const handleMove = (event: PointerEvent) => {
      const point = scaleToMm(event.clientX, event.clientY)
      if (!point) return
      onMove(drag.id, point.x - drag.offsetX, point.y - drag.offsetY)
    }
    const handleUp = () => setDrag(null)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => { window.removeEventListener('pointermove', handleMove); window.removeEventListener('pointerup', handleUp) }
  }, [drag, onMove, scaleToMm])

  // 清单点击定位：把画布滚动到设备可见，并播放一次高亮闪烁
  useEffect(() => {
    if (!locateSignal) return
    wrapRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'center' })
    setFlashId(locateSignal.id)
    const timer = window.setTimeout(() => setFlashId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [locateSignal])

  const startDrag = (event: ReactPointerEvent<SVGGElement>, item: DeskItem) => {
    event.stopPropagation()
    const point = scaleToMm(event.clientX, event.clientY)
    if (!point) return
    onSelect(item.id)
    setDrag({ id: item.id, offsetX: point.x - item.x, offsetY: point.y - item.y })
  }

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <div className="canvas-toolbar"><span><Move size={14} /> 拖动设备调整位置</span><span><RotateCw size={14} /> 旋转请在右侧操作</span></div>
      <svg ref={stageRef} className="desk-canvas" viewBox={`0 0 ${plan.deskWidthMm} ${plan.deskHeightMm}`} role="img" aria-label={`桌面布局画布，${plan.deskWidthMm}乘${plan.deskHeightMm}毫米`} onPointerDown={() => onSelect(null)}>
        <defs>
          <pattern id="desk-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d8e1ed" strokeWidth="1" /></pattern>
          <filter id="item-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#20304a" floodOpacity=".12" /></filter>
        </defs>
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="#f8fafc" />
        <rect width={plan.deskWidthMm} height={plan.deskHeightMm} rx="22" fill="url(#desk-grid)" />
        <text x="34" y="48" fill="#a0aec0" fontSize="20" letterSpacing="3">FOCUS ZONE / {plan.deskWidthMm} × {plan.deskHeightMm} MM</text>
        {plan.items.map((item) => {
          const definition = getDeviceDefinition(item.type)
          const isSelected = selectedItemId === item.id
          const hasIssue = analysis.overlapIds.includes(item.id) || analysis.outOfBoundsIds.includes(item.id)
          const cx = item.x + item.widthMm / 2
          const cy = item.y + item.heightMm / 2
          const label = getCanvasItemLabel(item)
          const nameLabel = fitCanvasLabel(label, item.widthMm - 16, Math.max(18, Math.min(32, item.widthMm / 16)))
          const dimensionLabel = fitCanvasLabel(`${item.widthMm} × ${item.heightMm}`, item.widthMm - 20, 16)
          const nameY = -Math.max(4, (item.heightMm - 60) / 4)
          const dimensionY = nameY + Math.max(20, nameLabel.fontSize * 0.75)
          return <g className={`desk-item ${isSelected ? 'is-selected' : ''} ${hasIssue ? 'has-issue' : ''} ${flashId === item.id ? 'is-located' : ''}`} key={item.id} onPointerDown={(event) => startDrag(event, item)} role="button" tabIndex={0} aria-label={`${label}，${item.widthMm}乘${item.heightMm}毫米，位置${Math.round(item.x)}，${Math.round(item.y)}`}>
            <g transform={`translate(${cx} ${cy}) rotate(${item.rotation})`}>
              <title>{label}</title>
              <rect x={-item.widthMm / 2} y={-item.heightMm / 2} width={item.widthMm} height={item.heightMm} rx={Math.min(24, item.heightMm / 5)} fill="none" className="locate-ring" />
              <rect x={-item.widthMm / 2} y={-item.heightMm / 2} width={item.widthMm} height={item.heightMm} rx={Math.min(24, item.heightMm / 5)} className="item-body" fill={definition.color} filter="url(#item-shadow)" />
              <rect className="item-inner-line" x={-item.widthMm / 2 + 12} y={-item.heightMm / 2 + 12} width={Math.max(0, item.widthMm - 24)} height={Math.max(0, item.heightMm - 24)} rx={12} fill="none" />
              <text x="0" y={nameY + nameLabel.fontSize / 3} textAnchor="middle" fill="#1f2e44" fontWeight="700" fontSize={nameLabel.fontSize}>{nameLabel.text}</text>
              <text x="0" y={dimensionY} textAnchor="middle" fill="#44546b" fontSize={dimensionLabel.fontSize}>{dimensionLabel.text}</text>
            </g>
            {isSelected && <rect className="selection-box" x={getItemBounds(item).left - 8} y={getItemBounds(item).top - 8} width={getItemBounds(item).width + 16} height={getItemBounds(item).height + 16} rx="12" fill="none" />}
            {hasIssue && <g transform={`translate(${Math.max(18, getItemBounds(item).right - 4)} ${Math.max(18, getItemBounds(item).top - 4)}`}><circle r="18" fill="#ef6a6a" /><text textAnchor="middle" y="7" fill="white" fontSize="22" fontWeight="700">!</text></g>}
          </g>
        })}
        {plan.items.length === 0 && <g><circle cx={plan.deskWidthMm / 2} cy={plan.deskHeightMm / 2 - 12} r="32" fill="#e8eef6" /><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 2} textAnchor="middle" fill="#8493a8" fontSize="22">+</text><text x={plan.deskWidthMm / 2} y={plan.deskHeightMm / 2 + 48} textAnchor="middle" fill="#8493a8" fontSize="22">从左侧添加第一件设备</text></g>}
      </svg>
      <div className="canvas-legend"><span><i className="legend-dot clear-dot" /> 可用空间</span><span><i className="legend-dot issue-dot" /> 冲突 / 越界</span><span className="canvas-scale">网格：50 mm</span></div>
    </div>
  )
}
