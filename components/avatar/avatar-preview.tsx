'use client'

import { useEffect, useRef, useState } from 'react'
import type { AvatarProfile } from '@/lib/avatar/profile'
import styles from './avatar-preview.module.css'
import { useGraphicsQuality } from '../games/graphics-toggle'

export function AvatarPreview({ profile, running = false }: { profile: AvatarProfile; running?: boolean }) {
  const { lowQuality } = useGraphicsQuality()
  const host = useRef<HTMLDivElement>(null)
  const motion = useRef(running)
  useEffect(() => { motion.current = running }, [running])
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!host.current) return
    const element = host.current
    const abort = new AbortController()
    let dispose: (() => void) | undefined
    import('@/lib/avatar/preview').then(({ createAvatarPreview }) => createAvatarPreview(element, profile, abort.signal, () => motion.current)).then((cleanup) => {
      if (abort.signal.aborted) cleanup?.()
      else dispose = cleanup
    }).catch(() => { if (!abort.signal.aborted) setError(true) })
    return () => { abort.abort(); dispose?.() }
  }, [profile, lowQuality])
  return <div className={styles.preview} ref={host}>{error && <p role="alert">Failed to load character.</p>}</div>
}
