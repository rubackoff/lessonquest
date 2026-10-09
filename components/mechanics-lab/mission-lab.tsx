'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { missionCatalog, type MissionId } from '@/lib/scenario-missions'
import { workshopMissions } from '@/lib/mission-content'
import { mechanicNames, type Subject } from '@/lib/mission-workshop'
import { DistrictMission, ExpeditionMission, StationMission, TransitMission } from './math-missions'
import { CityMission, MuseumMission } from './story-missions'
import { WorkshopMissionView } from './workshop-mission'
import { EnglishRoomMission } from './english-room-mission'
import { LuggageMission } from './luggage-mission'
import { ActiveMission } from './active-mission'
import { playScenario, playNames, playLoops } from '@/lib/mission-play'
import s from './missions.module.css'

const games = { expedition: ExpeditionMission, station: StationMission, city: CityMission, district: DistrictMission, museum: MuseumMission, transit: TransitMission }
const oldSubjects: Record<MissionId, Subject> = { expedition: 'Mathematics', station: 'Algebra', city: 'English', district: 'Geometry', museum: 'English', transit: 'Mathematics' }
const catalog = [
  ...missionCatalog.map(m => ({ ...m, subject: oldSubjects[m.id], audience: m.subject.split(' · ')[1], family: 'Scenario with separate rules' })),
  ...workshopMissions.map(m => { const play = playScenario(m); if (m.id === 'eng-luggage') return { ...m, hook: 'Inspect similar suitcases, check with the owner for details, correct the tag and send the luggage to the correct recipient.', loop: 'Inspection → clarification → comparison → tag and delivery', family: 'Baggage desk · independent / shared screen / with tutor' }; if (m.id === 'eng-hotel') return { ...m, hook: 'Prepare the room at the request of the guest: choose a room, move things, check the light and passage. Another guest will come in the morning.', loop: 'Study the room → request → your plan → guest reaction', family: 'English room · independent / shared screen / with tutor' }; return { ...m, hook: play ? playLoops[play.kind] : m.hook, loop: play ? playNames[play.kind] + ' · single / shared screen / two' : m.stages.map(a => a.title).join(' → '), family: play ? playNames[play.kind] : m.stages.map(a => mechanicNames[a.kind]).join(' · ') } }),
]
const subjects = [...new Set(catalog.map(m => m.subject))]
type Progress = Record<string, { phase: number; done: boolean }>
export function MissionLab() {
  const [id, setId] = useState<string | null>(null), [subject, setSubject] = useState('All subjects'), [query, setQuery] = useState(''), [page, setPage] = useState(0), [progress, setProgress] = useState<Progress>({}), [onlyUnfinished, setOnlyUnfinished] = useState(false), [onlyReworked, setOnlyReworked] = useState(false), heading = useRef<HTMLHeadingElement>(null)
  const current = catalog.find(m => m.id === id), original = missionCatalog.find(m => m.id === id), Game = original ? games[original.id] : null, workshop = workshopMissions.find(m => m.id === id)
  const active = workshop ? playScenario(workshop) : null
  const filtered = catalog.filter(m => (subject === 'All subjects' || m.subject === subject) && (!onlyReworked || workshopMissions.some(w => w.id === m.id && playScenario(w))) && (!onlyUnfinished || !progress[m.id]?.done) && `${m.title} ${m.hook} ${m.family} ${m.subject} ${m.audience}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')))
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12)), safePage = Math.min(page, pageCount - 1), visible = filtered.slice(safePage * 12, safePage * 12 + 12)
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0) }, [id])
  useEffect(() => {
    if (id) return
    const data: Progress = {}
    for (const item of catalog) {
      try { const draft = JSON.parse(localStorage.getItem(`corgi.missions.v1.${item.id === 'eng-luggage' ? 'luggage-v1-' : item.id === 'eng-hotel' ? 'room-v1-' : missionCatalog.some(m => m.id === item.id) ? '' : (['eng-news', 'hist-sources', 'ela-quote', 'math-census'].includes(item.id) ? 'play-v3-' : workshopMissions.some(m => m.id === item.id && playScenario(m)) ? 'play-v2-' : 'workshop-')}${item.id}`) ?? 'null'); if (draft && typeof draft.done === 'boolean' && Number.isInteger(draft.phase)) data[item.id] = { done: draft.done, phase: draft.phase } } catch { /* Ignore a damaged draft in the catalog. */ }
    }
    queueMicrotask(() => setProgress(data))
  }, [id])
  return <main className={s.page} data-mission={id || undefined}><header className={s.header}><Link href="/profile">LessonQuest</Link><Link href="/lab/mechanics">Quick practice</Link>{id && <button onClick={() => setId(null)}>All scenarios</button>}</header><div className={s.container}>
    {!current ? <><section className={s.intro}><p>Laboratory · {catalog.length} game scenarios</p><h1 ref={heading} tabIndex={-1}>Explore. Collect. <br />Check your plan.</h1><p>Games across {subjects.length} subjects: build molecules, explore in English, and investigate history.</p><small>Choose a subject and start a mission. Combine actions, manage shared resources, and respond as the story changes. Your progress is saved on this device.</small></section>
      <section className={s.catalogTools} aria-label="Find a game"><label>Search by topic or mechanics<input type="search" value={query} placeholder="For example: chemistry, experiments, routes" onChange={ev => { setQuery(ev.target.value); setPage(0) }} /></label><label>Subject<select value={subject} onChange={ev => { setSubject(ev.target.value); setPage(0) }}><option>All subjects</option>{subjects.map(name => <option key={name}>{name}</option>)}</select></label><label className={s.checkbox}><input type="checkbox" checked={onlyUnfinished} onChange={ev => { setOnlyUnfinished(ev.target.checked); setPage(0) }} />Not completed</label><label className={s.checkbox}><input type="checkbox" checked={onlyReworked} onChange={ev => { setOnlyReworked(ev.target.checked); setPage(0) }} />Updated interactive games (33)</label></section>
      <p className={s.catalogCount}>Found: {filtered.length} · completed: {Object.values(progress).filter(p => p.done).length} / {catalog.length}</p>
      <div className={s.catalog}>{visible.map(m => <article key={m.id}><p className={s.eyebrow}>{m.subject} / {m.audience}</p><h2>{m.title}</h2><p>{m.hook}</p><div className={s.loop}>{m.loop}</div><small className={s.progressLabel}>{progress[m.id]?.done ? '✓ Mission completed · can be replayed' : progress[m.id]?.phase ? `Stage saved ${progress[m.id].phase + 1}` : 'New mission'}</small><button className={s.primary} onClick={() => setId(m.id)}>Play: {m.title}</button></article>)}</div>
      {!filtered.length && <p role="status">No games were found for this request. Shorten your request or choose another item.</p>}
      <nav className={s.pagination} aria-label="Catalog pages"><button disabled={safePage === 0} onClick={() => { setPage(safePage - 1); window.scrollTo(0, 0) }}>Previous</button><span>Page {safePage + 1} from {pageCount}</span><button disabled={safePage + 1 >= pageCount} onClick={() => { setPage(safePage + 1); window.scrollTo(0, 0) }}>Next</button></nav>
      <aside className={s.catalogNote}><strong>8 short trainers are also available</strong><p>Separate practice with scales, functions, geometry and English clues.</p><Link href="/lab/mechanics">Open trainers →</Link></aside></> : <><section className={s.missionTitle}><p>{current.subject} · {current.audience}</p><h1 ref={heading} tabIndex={-1}>{current.title}</h1><p>{current.hook}</p></section>{Game ? <Game key={id} /> : id === 'eng-luggage' ? <LuggageMission key={id}/> : id === 'eng-hotel' ? <EnglishRoomMission key={id}/> : active ? <ActiveMission key={id} game={active} /> : workshop ? <WorkshopMissionView key={id} mission={workshop} /> : null}</>}
    <footer className={s.footer}>Drafts to test gameplay. Without heavy graphics and a mandatory timer.<Link href="/profile">Character and previous games →</Link></footer>
  </div></main>
}
