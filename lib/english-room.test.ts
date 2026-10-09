import { describe, expect, it } from 'vitest'
import { changeRoom, testRoomCall, finishRoomVisit, initialRoom, inviteRoomGuest, morningVisit, roomAct, roomPath, roomProblem, roomWalkStep, visitRoomObject, type RoomAction, type RoomState } from './english-room'

function settle(s: RoomState) { for (let i = 0; i < 40 && (s.route.length || s.guestRoute.length); i++) s = roomWalkStep(s); return s }
function interact(s: RoomState, cell: number, action: RoomAction) {
  s = settle(visitRoomObject(s, cell))
  expect(s.focus, `Object ${cell} must be reachable`).toBe(cell)
  return roomAct(s, action)
}
function prepare(s: RoomState, morning = false) {
  s = interact(s, s.boxes[s.room], 'move-left')
  s = interact(s, 0, morning ? 'open' : 'close')
  if (morning) { s = interact(s, 0, 'close'); s = interact(s, 6, 'unplug'); s = interact(s, 8, 'plug') }
  else { s = interact(s, 6, 'plug'); s = interact(s, 6, 'on') }
  s = interact(s, 5, 'open')
  for (const colour of ['red', 'blue'] as const) {
    const index = s.room * 2 + (colour === 'red' ? 0 : 1)
    s = interact(s, s.mugs[index], colour)
    s = interact(s, morning ? colour === 'blue' ? 9 : 4 : colour === 'red' ? 8 : 4, 'put')
  }
  return s
}
describe('English requests change the room itself', () => {
  it.each([0, 1])('allows an independently prepared night room %i', room => {
    let s = changeRoom({ ...initialRoom, phase: 1 }, room)
    s = prepare(s)
    expect(roomProblem(s)).toBeNull()
    s = inviteRoomGuest(s)
    expect(s.done).toBe(false)
    expect(s.guestRoute.length).toBeGreaterThan(0)
    s = finishRoomVisit(settle(s))
    expect(s.done).toBe(true); expect(s.guestPos).toBe(14)
  })
  it('accepts both tables, both storage positions and an open courtyard window', () => {
    let s = prepare({ ...initialRoom, phase: 1, room: 1 })
    s = interact(s, 0, 'open'); s = interact(s, 8, 'red'); s = interact(s, 9, 'put')
    s = interact(s, s.boxes[1], 'move-right')
    expect(roomProblem(s)).toBeNull()
  })
  it('requires a clear doorway and a powered lamp, with recoverable consequences', () => {
    let s = interact({ ...initialRoom, phase: 1 }, 6, 'on')
    expect(s.lights[0]).toBe(0); expect(s.mistakes).toEqual([1])
    expect(roomPath(28, 14, s.boxes[0])).toBeNull()
    s = inviteRoomGuest(s)
    expect(s.done).toBe(false); expect(s.mistakes).toContain(3)
    expect(roomProblem(prepare(s))).toBeNull()
  })
  it('does not mutate a distant object or carry two mugs or carry one across rooms', () => {
    let s = { ...initialRoom, phase: 1, focus: 0 }
    expect(roomAct(s, 'close')).toEqual(s)
    s = interact(s, 5, 'open'); s = interact(s, 5, 'red')
    const carrying = s.carrying
    expect(roomAct(s, 'blue').carrying).toBe(carrying)
    expect(changeRoom(s, 1).room).toBe(0)
  })
  it('preserves the first room but requires new decisions for the morning guest', () => {
    let s = finishRoomVisit(settle(inviteRoomGuest(prepare({ ...initialRoom, phase: 1, room: 1 }))))
    const previous = [...s.mugs]
    s = morningVisit(JSON.parse(JSON.stringify(s)))
    expect(s.done).toBe(false); expect(s.mugs).toEqual(previous)
    expect(roomProblem(s)?.code).toBe(2)
    s = prepare(changeRoom(s, 0), true)
    expect(s.mugs.slice(2)).toEqual(previous.slice(2))
    expect(finishRoomVisit(testRoomCall(settle(inviteRoomGuest(s)))).done).toBe(true)
  })
  it('requires ventilation before quiet, changing the powered device and a drink away from the laptop', () => {
    let s = morningVisit(finishRoomVisit(settle(inviteRoomGuest(prepare({ ...initialRoom, phase: 1 })))))
    expect(roomProblem(s)?.code).toBe(6)
    s = interact(s, 0, 'open'); expect(roomProblem(s)?.code).toBe(9)
    s = interact(s, 0, 'close'); expect(roomProblem(s)?.code).toBe(10)
    s = interact(s, 6, 'off'); s = interact(s, 8, 'plug')
    expect(s.laptopPlugged).toBe(false); expect(s.feedback).toMatch(/Turning the lamp off/)
    s = prepare(s, true); expect(roomProblem(s)).toBeNull()
    s = interact(s, 9, 'blue'); s = interact(s, 8, 'put'); expect(roomProblem(s)?.code).toBe(8)
    s = interact(s, 8, 'blue'); s = interact(s, 9, 'put')
    s = settle(inviteRoomGuest(s)); expect(finishRoomVisit(s).done).toBe(false)
    s = testRoomCall(s); expect(s.callPassed).toBe(true)
    s = interact(s, 0, 'open'); expect(s.callPassed).toBe(false)
    expect(testRoomCall(s).callPassed).toBe(false)
    s = interact(s, 0, 'close'); expect(finishRoomVisit(testRoomCall(s)).done).toBe(true)
  })
  it('keeps an older saved room and its objects while adding the new morning conditions', () => {
    const older = JSON.parse(JSON.stringify({ ...initialRoom, phase: 2, boxes: [18, 26], mugs: [4, 9, 5, 5] })) as RoomState
    expect(roomProblem(older)?.code).toBe(6)
    const prepared = prepare(older, true)
    expect(prepared.boxes[1]).toBe(26); expect(prepared.mugs.slice(2)).toEqual([5, 5])
    expect(finishRoomVisit(testRoomCall(settle(inviteRoomGuest(prepared)))).done).toBe(true)
  })
  it('keeps teacher role from changing pupil objects', () => {
    const s = { ...initialRoom, phase: 1, partner: true, focus: 5, pos: 11 }
    expect(roomAct(s, 'open')).toEqual(s)
    expect(visitRoomObject(s, 0)).toEqual(s)
  })
})
