'use client'

import { useEffect, useRef } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { avatarSkins, type AvatarProfile } from '@/lib/avatar/profile'
import { AvatarPreview } from '@/components/avatar/avatar-preview'
import styles from './space-maze.module.css'

export function AvatarWardrobe({ profile, onChange, onClose, saved, actionLabel = 'On an expedition' }: {
  profile: AvatarProfile; onChange: (profile: AvatarProfile) => void; onClose: () => void; saved: boolean; actionLabel?: string
}) {
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => { dialog.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus() }, [])
  return <div className={styles.scrim}>
    <section className={styles.wardrobe} role="dialog" aria-modal="true" aria-labelledby="avatar-title" ref={dialog} onKeyDown={(event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const buttons = [...(dialog.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      event.preventDefault()
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus()
    }}>
      <div className={styles.wardrobeHeading}><h2 id="avatar-title">Your character</h2><p>One hero - different games.</p></div>
      <AvatarPreview key={profile.skinId} profile={profile} />
      <div className={styles.skinOptions}>
        {avatarSkins.map((skin) => <button key={skin.id} aria-pressed={skin.id === profile.skinId} onClick={() => onChange({ version: 1, skinId: skin.id })}>
          <span className={styles.skinDot} style={{ background: skin.color }} />
          <span>{skin.name}</span>
          {skin.id === profile.skinId && <Check size={18} />}
        </button>)}
        <p className={styles.saveNote}>{saved ? 'The selection is saved in this browser.' : 'The choice is valid for this session.'}<br />Three looks for your hero.</p>
        <button className={styles.primary} onClick={onClose}>{actionLabel}<ChevronRight size={18} /></button>
      </div>
    </section>
  </div>
}
