'use client'

import { useEffect } from 'react'
import { Archive, BedDouble, BookOpen, Coffee, DoorOpen, Lamp, Laptop, Package, Square, UserRound } from 'lucide-react'
import { changeRoom, testRoomCall, finishRoomVisit, roomProblem, initialRoom, inviteRoomGuest, morningVisit, roomAct, roomNames, roomRequests, roomTranslations, roomWalkStep, visitRoomObject, type RoomAction } from '@/lib/english-room'
import { Frame, useMission } from './mission-shared'
import s from './english-room.module.css'

const questions = ['Where would you like to stay?', 'Would you like the window open?', 'Which mug would you like?']
const replies = [
  ['Somewhere quiet. The courtyard is quiet; a closed street window also works.', 'Keep street noise out, please. The courtyard window can stay open.', 'The red mug on a table. Leave the blue one on the shelf.'],
  ['On the ground floor, please. I cannot use stairs today.', 'Air the room before the call, then close the street window so the microphone does not pick up traffic.', 'Blue on the side table, away from the laptop. Red on the shelf.'],
]
const labels: Record<number, string> = { 0: 'Window', 2: 'Bed', 3: 'Bed', 4: 'Shelf', 5: 'Cupboard', 6: 'Lamp', 8: 'Desk', 9: 'Side table', 28: 'Door' }
export function EnglishRoomMission() {
  const m = useMission('room-v1-eng-hotel', initialRoom), v = m.state, day = Math.max(0, v.phase - 1)
  const moving = !!(v.route.length || v.guestRoute.length), tutor = v.mode === 'coop' && v.partner
  useEffect(() => {
    if (!m.ready || tutor || (!v.route.length && (!v.guestRoute.length || v.mode === 'show'))) return
    const timer = window.setTimeout(() => m.update(roomWalkStep(v)), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 140)
    return () => window.clearTimeout(timer)
  }, [m, v, tutor])
  const settled = v.guestPos === 14 && !moving && !roomProblem(v)
  const focus = v.focus, name = focus === v.boxes[v.room] ? 'Box' : labels[focus]
  const mugsHere = [0, 1].filter(n => v.mugs[v.room * 2 + n] === focus && (focus !== 5 || v.cupboards[v.room]))
  const act = (action: RoomAction) => m.update(roomAct(v, action))
  const button = (label: string, action: RoomAction) => <button key={action} disabled={moving} onClick={() => act(action)}>{label}</button>
  return <>
    <Frame {...m} {...v} phases={v.phase < 2 ? ['Night shift', 'Room for Maya'] : ['Night shift', 'Room for Maya', 'Morning Guest']} resources={[v.phase > 0 ? roomNames[v.room] : 'English in action', `Clarifications and translations: ${v.hints}`, `Trial with correction: ${v.mistakes.length}`]} ending={`${v.feedback} You have prepared the room at the request of the guest. Clarifications and translations: ${v.hints}; trial with correction: ${v.mistakes.length}. The items, window and lighting are saved for the next guest.`}>
      {v.phase === 0 ? <div className={s.intro}><p>A late guest is waiting for his room. Understand his request, choose a room and prepare it: walk around the room, open the closet, move the mugs, check the light and passage.</p><p>Click on an object or place on the plan. The character comes up on his own. For conversation and assistance there are short English remarks and translation upon request.</p><div className={s.modes}>{[['solo', 'Independently'], ['show', 'General screen'], ['coop', 'With a tutor']].map(([mode, label]) => <button key={mode} aria-pressed={v.mode === mode} onClick={() => m.update({ mode })}>{label}</button>)}</div><button className={s.primary} onClick={() => m.update({ phase: 1 })}>Start night shift</button></div> : <>
        {v.mode === 'coop' && <div className={s.roles}><p>Locally on one screen: the tutor is a guest with a request, the student is the owner of the room. Discuss the conditions, the student acts on his own.</p><button disabled={moving} onClick={() => m.update({ partner: !v.partner })}>{tutor ? 'Give to student' : 'Show request to tutor'}</button></div>}
        {tutor ? <section className={s.guestCard}><h3>{day === 0 ? 'Maya' : 'Alex'} guest role</h3><p lang="en">{roomRequests[day]}</p><p>Don&apos;t list the buttons you need. Respond to the student&apos;s clarifications and explain what suits you in the prepared room. Maya has two valid quiet room options; Alex needs the first floor.</p></section> : <>
          <div className={s.request}><strong>{day === 0 ? 'Maya · 22:15' : 'Alex · 09:00'}</strong><p lang="en">{v.mode === 'coop' ? 'A guest is waiting. Ask your partner what they need before preparing the room.' : roomRequests[day]}</p><details><summary onClick={() => m.update({ hints: v.hints + 1 })}>Help with English</summary><p>{roomTranslations[day]}</p><p>on - on · inside -- inside · shelf -- shelf · cupboard -- closet · ground floor -- first floor · upstairs -- at the top · plug in -- connect · turn on -- turn on.</p></details></div>
          <div className={s.rooms}>{roomNames.map((label, room) => <button key={label} aria-pressed={v.room === room} disabled={moving} onClick={() => m.update(changeRoom(v, room))}>{label}</button>)}</div>
          <div className={s.playArea}>
            <section className={s.scene} aria-label="Room above" data-light={!!v.lights[v.room]} data-room={v.room}>
              <div className={s.tiles} role="group" aria-label="Items and passages">
                {Array.from({ length: 30 }, (_, cell) => {
                  const box = cell === v.boxes[v.room], label = box ? 'Box' : labels[cell], bed = cell === 2 || cell === 3
                  const Icon = box ? Package : bed ? BedDouble : cell === 0 ? Square : cell === 5 || cell === 4 ? Archive : cell === 6 ? Lamp : cell === 28 ? DoorOpen : cell === 8 && day === 1 && v.room === 0 ? Laptop : cell === 8 || cell === 9 ? Coffee : null
                  const mugs = [0, 1].filter(n => v.mugs[v.room * 2 + n] === cell && (cell !== 5 || v.cupboards[v.room]))
                  return <button key={cell} data-room-cell={cell} disabled={moving || bed || [27, 29].includes(cell)} className={s.tile} data-object={!!label} data-selected={focus === cell} data-wall={[27, 29].includes(cell)} aria-label={label ? `${label}${cell === 0 ? v.windows[v.room] ? ' · open' : ' · closed' : cell === 5 ? v.cupboards[v.room] ? ' · open' : ' · closed' : ''}` : `Walk to ${cell + 1}`} onClick={() => m.update(visitRoomObject(v, cell))}>
                    {Icon && <Icon size={24}/>}<span>{label}</span>{cell === 0 && <small>{v.windows[v.room] ? 'open' : 'closed'}</small>}{cell === 6 && <small>{v.lights[v.room] ? 'ON' : 'OFF'}</small>}
                    {!!mugs.length && <i>{mugs.map(n => <Coffee key={n} size={14} aria-label={n === 0 ? 'red mug' : 'blue mug'} color={n === 0 ? '#b84c45' : '#376faa'}/>)}</i>}
                  </button>
                })}
              </div>
              <span className={s.person} style={{ left: `${(v.pos % 6 + .5) / 6 * 100}%`, top: `${(Math.floor(v.pos / 6) + .5) / 5 * 100}%` }} aria-label="You"><UserRound size={21}/>{v.carrying >= 0 && <Coffee size={13} color={v.carrying % 2 === 0 ? '#ffd2bf' : '#a2d6ff'}/>}</span>
              <span className={s.guest} style={{ left: `${(v.guestPos % 6 + .5) / 6 * 100}%`, top: `${(Math.floor(v.guestPos / 6) + .5) / 5 * 100}%` }} aria-label={`Guest: ${day === 0 ? 'Maya' : 'Alex'}`}>{settled ? day === 1 ? <Laptop size={17}/> : <BookOpen size={17}/> : day === 0 ? 'M' : 'A'}</span>
            </section>
            <section className={s.actions} aria-label="Actions with an object"><h3>{moving ? 'Walking…' : name || 'Explore the room'}</h3><p className={s.inventory}>In hands: {v.carrying < 0 ? 'nothing' : v.carrying % 2 === 0 ? 'red mug' : 'blue mug'}</p>
              <div className={s.buttons}>{!moving && <>
                {focus === 0 && <>{button('Open the window', 'open')}{button('Close the window', 'close')}</>}
                {focus === 5 && <>{button('Open the cupboard', 'open')}{button('Close the cupboard', 'close')}</>}
                {focus === 6 && <>{button('Plug in the lamp', 'plug')}{button('Unplug the lamp', 'unplug')}{button('Turn on the lamp', 'on')}{button('Turn off the lamp', 'off')}</>}
                {focus === 8 && day === 1 && v.room === 0 && <>{button('Plug in the laptop', 'plug')}{button('Unplug the laptop', 'unplug')}</>}
                {[4, 5, 8, 9].includes(focus) && <>{mugsHere.map(n => button(n === 0 ? 'Take the red mug' : 'Take the blue mug', n === 0 ? 'red' : 'blue'))}{v.carrying >= 0 && button(focus === 4 ? 'Put it on the shelf' : focus === 5 ? 'Put it inside the cupboard' : 'Put it on this table', 'put')}</>}
                {focus === v.boxes[v.room] && <>{button('Move beside the left wall', 'move-left')}{button('Move beside the right wall', 'move-right')}</>}
              </>}</div>
              {!name && <p>Click on an item on the plan to approach and select an action. Mugs can be moved between the cabinet, shelf and both tables.</p>}
            </section>
          </div>
          {day === 1 && <section className={s.call} aria-label="Checking a video call" data-ready={!!v.callPassed}><Laptop size={26}/><div><strong>{v.callPassed ? 'Video call connected' : 'Video call · test desk'}</strong><p>Socket: {v.laptopPlugged ? 'laptop' : v.plugs[0] ? 'lamp' : 'free'} · Laptop: {v.laptopPlugged ? 'charging' : 'low battery'}<br/>Room: {v.aired ? 'aired' : 'not aired yet'} · Microphone: {v.windows[v.room] && v.room === 0 ? 'street noise' : 'quiet'}</p>{v.guestPos !== 14 && <small>First, invite Alex to the table - then you can check the call.</small>}</div><button disabled={moving || v.guestPos !== 14} onClick={() => m.update(testRoomCall(v))}>Test the video call</button></section>}
          <p className={s.feedback} role="status" lang="en">{v.feedback || 'The room is yours to prepare. There is more than one way to make your guest comfortable.'}</p>
          <div className={s.invite}>{settled && (day === 0 || v.callPassed) && <button className={s.primary} onClick={() => m.update(finishRoomVisit(v))}>The guest is settled · end the visit</button>}<button className={s.primary} disabled={moving} onClick={() => m.update(inviteRoomGuest(v))}>Invite the guest · check the room</button>{v.mode === 'show' && v.guestRoute.length > 0 && <button onClick={() => m.update(roomWalkStep(v))}>Guest&apos;s next step</button>}</div>
          <details className={s.conversation}><summary>Ask the guest · clarify request</summary><div className={s.buttons}>{questions.map((q, i) => <button key={q} onClick={() => m.update({ question: i, hints: v.hints + 1 })}>{q}</button>)}</div>{v.question >= 0 && <p lang="en">{replies[day][v.question]}</p>}</details>
        </>}
      </>}
    </Frame>
    {v.done && v.phase === 1 && <section className={s.continue}><h3>The room is ready. Continuation - optional</h3><p>In the morning, Alex needs to prepare for the video interview: ventilation, silence, power for the laptop and a place for a drink. The rooms will remain the way you made them.</p><button className={s.primary} onClick={() => m.update(morningVisit(v))}>Morning guest · continue at home</button></section>}
  </>
}
