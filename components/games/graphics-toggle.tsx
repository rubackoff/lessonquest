'use client'

import { useEffect, useState } from 'react'
import { graphicsStorageKey, lowGraphics } from '@/lib/graphics'

export function useGraphicsQuality() {
  const [lowQuality, setValue] = useState(false)
  useEffect(() => {
    const sync = () => setValue(lowGraphics())
    queueMicrotask(sync)
    window.addEventListener('storage', sync)
    window.addEventListener('corgi-graphics-change', sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('corgi-graphics-change', sync) }
  }, [])
  const setLowQuality = (value: boolean) => {
    setValue(value)
    try { localStorage.setItem(graphicsStorageKey, String(value)) } catch { /* Session preference still applies. */ }
    window.dispatchEvent(new Event('corgi-graphics-change'))
  }
  return { lowQuality, setLowQuality }
}

export function GraphicsToggle({ lowQuality, onChange }: { lowQuality: boolean; onChange: (value: boolean) => void }) {
  return <button aria-label="Light graphics" aria-pressed={lowQuality} title={lowQuality ? 'Light graphics: enabled' : 'Light graphics: off'} onClick={() => onChange(!lowQuality)} style={{ fontSize: 12, padding: '8px 10px', minHeight: 40, width: 'auto' }}>
    {lowQuality ? 'Graphics: easy' : 'Graphics: normal'}
  </button>
}
