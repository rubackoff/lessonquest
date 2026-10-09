'use client'

import Image from 'next/image'
import { anchors, directions, edgeAnchors, edgeDirection, type Edge } from '@/lib/expedition/content'
import type { ExpeditionSession } from '@/lib/expedition/session'
import styles from './expedition.module.css'

export function ConstructionBoard({ session, scheme, act, onAssetError }: { session: ExpeditionSession; scheme: boolean; act: (action: () => void) => void; onAssetError: () => void }) {
  const c = session.content, area = session.topic === 'area'
  const parts = area ? [{ id: -1, edge: 'ac' as Edge, length: c.horizontal, direction: 0 }, { id: -2, edge: 'cb' as Edge, length: c.vertical, direction: 1 }] : session.draft.parts
  return <>
    <Image className={styles.terrain} src="/game-assets/expedition/gorge.webp" alt="Stone banks of the gorge, river and intermediate support" fill priority sizes="(max-width: 720px) 100vw, 65vw" onError={onAssetError} />
    <svg className={styles.drawing} viewBox="0 0 100 100" aria-label="Crossing scheme" role="img">
      <defs><pattern id="expedition-wood" patternUnits="userSpaceOnUse" width="6" height="6"><image href="/game-assets/expedition/wood.webp" width="6" height="6" /></pattern></defs>
      {scheme && <rect width="100" height="100" fill="#f6fbf5" opacity=".88" />}
      {(['ab', 'ac', 'cb'] as Edge[]).map(edge => {
        const [from, to] = edgeAnchors[edge], a = anchors[from], b = anchors[to], active = session.edges.includes(edge)
        return <line key={edge} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? '#d9f7e9' : '#8acecd'} strokeWidth={active ? .65 : .35} strokeDasharray="1 1.1" opacity={scheme || active ? 1 : .65} />
      })}
      {parts.map((part, index) => {
        const a = anchors[edgeAnchors[part.edge][0]], before = parts.slice(0, index).filter(p => p.edge === part.edge).reduce((sum, p) => sum + p.length, 0)
        const scale = 30 / c.horizontal, expectedAngle = directions[edgeDirection[part.edge]].angle * Math.PI / 180
        const x = a.x + Math.cos(expectedAngle) * before * scale, y = a.y + Math.sin(expectedAngle) * before * scale
        return <g key={part.id} transform={`translate(${x} ${y}) rotate(${directions[part.direction].angle})`}>
          <rect x="0" y="-2.4" width={part.length * scale} height="4.8" rx=".4" fill="#263f38" opacity=".24" transform="translate(.25 .65)" />
          <rect x="0" y="-2.4" width={part.length * scale} height="4.8" rx=".3" fill="url(#expedition-wood)" stroke={session.selectedPart === part.id ? '#21e3bb' : '#81623b'} strokeWidth={session.selectedPart === part.id ? .5 : .2} />
          <path d={`M.4 -2.05 H${part.length * scale - .4} M.4 2.05 H${part.length * scale - .4}`} stroke="#eac187" strokeWidth=".3" />
        </g>
      })}
      {area && session.draft.platform && (() => {
        const p = session.draft.platform, unit = 2.4, width = p.width * unit, height = p.height * unit
        return <g><rect x={anchors.c.x - width / 2} y={anchors.c.y - height / 2} width={width} height={height} rx=".6" fill="url(#expedition-wood)" stroke="#21bf94" strokeWidth=".55" /><text className={styles.mapText} x={anchors.c.x} y={anchors.c.y - 2 - height / 2} textAnchor="middle">{p.width} m</text><text className={styles.mapText} x={anchors.c.x + 2 + width / 2} y={anchors.c.y + 1}>{p.height} m</text></g>
      })()}
      {!area && <><text className={styles.mapText} x="45" y="72" textAnchor="middle">{session.topic === 'scale' ? '3 cm' : `${c.horizontal} m`}</text><text className={styles.mapText} x="67" y="45">{session.topic === 'scale' ? '4 cm' : `${c.vertical} m`}</text><path d="M56 64 V60 H60" fill="none" stroke="#d7fff1" strokeWidth=".45" /><text className={styles.mapText} x="40" y="43">{session.topic !== 'segments' && ['passed', 'crossing', 'finished'].includes(session.phase) ? `${c.diagonal} m` : '?'}</text></>}
    </svg>
    {Object.entries(anchors).map(([id, point]) => <button key={id} className={styles.anchor} style={{ left: `${point.x}%`, top: `${point.y}%` }} disabled={!session.editable} aria-label={`point ${id === 'a' ? 'A' : id === 'b' ? 'B' : 'C'}`} aria-pressed={session.from === id} onClick={() => act(() => session.anchor(id as keyof typeof anchors))}>{id === 'a' ? 'A' : id === 'b' ? 'B' : 'C'}</button>)}
    <div className={styles.mapCaption}>{area ? 'Support area C · dimensions according to conditions' : session.topic === 'scale' ? `Drawing: 1 cm = ${c.scale / 100} m` : 'A - start B - other bank C - support'}</div>
  </>
}
