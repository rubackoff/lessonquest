'use client'

import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { ArrowRight, Award, Check, CheckCircle2 } from 'lucide-react'
import { avatarSkins, type AvatarProfile } from '@/lib/avatar/profile'
import { useLocalAvatar } from '@/lib/avatar/use-local-avatar'
import { AvatarPreview } from '@/components/avatar/avatar-preview'
import styles from './avatar-profile.module.css'
import { GraphicsToggle, useGraphicsQuality } from '../games/graphics-toggle'
import { decodeLearningProgress, learningProgressSnapshot, subscribeLearningProgress } from '@/lib/learning-achievements'

const serverProgressSnapshot = () => ''

export function AvatarProfilePage() {
  const { lowQuality, setLowQuality } = useGraphicsQuality()
  const { profile, save, saved, ready } = useLocalAvatar()
  const [draft, setDraft] = useState<AvatarProfile | null>(null)
  const [notice, setNotice] = useState('')
  const [running, setRunning] = useState(false)
  const progressRaw = useSyncExternalStore(subscribeLearningProgress, learningProgressSnapshot, serverProgressSnapshot)
  const achievements = useMemo(() => Object.values(decodeLearningProgress(progressRaw).progress).flatMap(item => item.achievement ? [item.achievement] : []), [progressRaw])
  const selected = draft ?? profile
  const currentSkin = avatarSkins.find((skin) => skin.id === selected.skinId)!
  const dirty = Boolean(draft && draft.skinId !== profile.skinId)

  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>Lesson<span>Quest</span></Link>
      <Link href="/studio" className={styles.studio}>To the studio<ArrowRight size={19} /></Link>
      <GraphicsToggle lowQuality={lowQuality} onChange={setLowQuality} />
    </header>
    <div className={styles.content}>
      <div className={styles.heading}><h1>Personal account</h1><p>Your character for educational games</p></div>
      <section className={styles.editor} aria-label="Choosing a character's appearance">
        <div className={styles.preview}>
          {ready ? <AvatarPreview key={selected.skinId} profile={selected} running={running} /> : <p role="status">Loading the character...</p>}
          <button className={styles.motionButton} aria-pressed={running} disabled={!ready} onClick={() => setRunning(!running)}>{running ? 'Stop' : 'Show running'}</button>
          <span className={styles.previewCaption}>Skin: {currentSkin.name}</span>
        </div>
        <div className={styles.settings}>
          <h2>Select skin</h2>
          <p className={styles.description}>One hero - different games.</p>
          <div className={styles.skins} role="group" aria-label="Three character looks">
            {avatarSkins.map((skin) => <button key={skin.id} aria-label={`Skin ${skin.name}`} aria-pressed={selected.skinId === skin.id} disabled={!ready} onClick={() => {
              setDraft({ version: 1, skinId: skin.id }); setNotice('')
            }}>
              <span className={styles.swatch} style={{ background: skin.color }}><span style={{ background: skin.secondaryColor }} /></span>
              <strong>{skin.name}</strong>
              <small>{skin.description}</small>
              {selected.skinId === skin.id && <Check className={styles.selectedCheck} size={17} />}
            </button>)}
          </div>
          <button className={styles.save} disabled={!ready} onClick={() => {
            const success = save(selected)
            setDraft(null)
            setNotice(success ? 'Skin saved. He will appear in games.' : 'The browser did not allow me to save the skin. Check your storage settings.')
          }}>Save skin{saved && !dirty && <CheckCircle2 size={18} />}</button>
          <Link className={styles.play} href="/lab/space-maze" aria-disabled={dirty} onClick={(event) => {
            if (dirty) { event.preventDefault(); setNotice('First save the selected skin.') }
          }}>Open the maze<ArrowRight size={18} /></Link>
          <Link className={styles.play} href="/lab/orbital-runner" aria-disabled={dirty} onClick={(event) => {
            if (dirty) { event.preventDefault(); setNotice('First save the selected skin.') }
          }}>Open runner<ArrowRight size={18} /></Link>
          <Link className={styles.play} href="/lab/tower-defense" aria-disabled={dirty} onClick={(event) => {
            if (dirty) { event.preventDefault(); setNotice('First save the selected skin.') }
          }}>Base Defense<ArrowRight size={18} /></Link>
          <Link className={styles.play} href="/lab/expedition" aria-disabled={dirty} onClick={(event) => {
            if (dirty) { event.preventDefault(); setNotice('First save the selected skin.') }
            }}>Expedition with construction<ArrowRight size={18} /></Link>
            <Link className={styles.play} href="/lab/missions" aria-disabled={dirty} onClick={(event) => {
              if (dirty) { event.preventDefault(); setNotice('First save the selected skin.') }
            }}>Games and simulators<ArrowRight size={18} /></Link>
          <p className={styles.notice} role="status">{notice || (dirty ? 'There are unsaved changes.' : 'The profile is stored in this browser.')}</p>
        </div>
      </section>
      <section className={styles.achievements} aria-label="Achievements for homework"><h2><Award size={24} />Achievements for Homework</h2>
        {achievements.length ? <ul>{achievements.map(achievement => <li key={achievement.id}><Award size={22} /><span><strong>{achievement.title}</strong><small>{achievement.lessonTitle} · {achievement.templateId === 'expedition' ? 'Expedition' : achievement.templateId === 'tower-defense' ? 'Base Defense' : achievement.templateId === 'character-heist' ? 'Character Hunt' : achievement.templateId === 'forest-camp' ? 'Forest camp' : achievement.templateId === 'space-maze' ? 'Labyrinth' : 'Runner'}</small></span></li>)}</ul> : <p>Continue practicing at home and correct mistakes to get achievements.</p>}
      </section>
      <footer className={styles.footer}>The selected clothes are saved for the next games.<span>This is a local prototype, no registration or purchases required.</span></footer>
    </div>
  </main>
}
