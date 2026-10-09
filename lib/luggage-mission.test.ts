import { describe, expect, it } from 'vitest'
import { answerLuggage, askLuggage, continueLuggage, initialLuggage, inspectLuggage, labelLuggage, luggageClaims, luggageOnBelt, luggageTransferStep, markLuggageFact, openLuggagePocket, sendLuggage, storeLuggage, takeLuggage, verifyLuggage, type LuggageState } from './luggage-mission'

function identify(s: LuggageState, bag = luggageClaims[s.claim].bag) {
  s = takeLuggage(s, bag)
  if (s.claim === 2) return verifyLuggage(markLuggageFact(markLuggageFact(inspectLuggage(s), 2), 4))
  s = askLuggage(s, 0)
  if (s.partner) s = answerLuggage(s)
  s = openLuggagePocket(s); s = markLuggageFact(s, 1); s = markLuggageFact(s, 5)
  return verifyLuggage(s)
}
function collect(s: LuggageState) {
  const claim = luggageClaims[s.claim]
  s = identify(s); s = labelLuggage({ ...s, label: claim.owner, collector: claim.collector })
  if (s.claim === 2) { s = askLuggage(s, 1); if (s.partner) s = answerLuggage(s) }
  s = sendLuggage(s)
  expect(s.moving, s.feedback).toBe(true)
  for (let i = 0; i < 3; i++) s = luggageTransferStep(s)
  return s
}
describe('luggage desk: English changes what happens to persistent objects', () => {
  it.each(['solo', 'show', 'coop'])('finishes two claims and the delegated collection in %s', mode => {
    let s = { ...initialLuggage, phase: 1, mode }
    s = collect(s); expect(s.claim).toBe(1); expect(s.done).toBe(false); expect(s.tags[1]).toBe(3)
    s = takeLuggage(s, 1); expect(s.transfer).toBe(0)
    s = collect(s); expect(s.done).toBe(true); expect(s.delivered).toEqual([0, 1])
    const previous = [...s.tags]
    s = continueLuggage(JSON.parse(JSON.stringify(s))); expect(s.tags).toEqual(previous)
    s = collect(s); expect(s.done).toBe(true); expect(s.delivered).toEqual([0, 1, 2]); expect(s.tags[2]).toBe(2)
  })
  it('rejects a similar bag and an unobserved pocket, retaining the learner’s work', () => {
    let s = takeLuggage({ ...initialLuggage, phase: 1 }, 1)
    s = openLuggagePocket(s); expect(s.pockets).toEqual([])
    s = identify(s, 1); expect(s.verified).toBe(-1); expect(s.selected).toBe(1)
    s = storeLuggage(s, true); expect(s.positions[1]).toBe(2); expect(s.pockets).toContain(1)
    s = identify(s, 0); expect(s.verified).toBe(0); expect(s.positions[1]).toBe(2)
  })
  it('requires the owner’s description as well as observing extra features', () => {
    let s = inspectLuggage(takeLuggage({ ...initialLuggage, phase: 1 }, 0))
    s = openLuggagePocket(askLuggage(s, 0)); s = markLuggageFact(markLuggageFact(s, 2), 5)
    expect(verifyLuggage(s).verified).toBe(-1)
    expect(verifyLuggage(askLuggage(s, 2)).verified).toBe(0)
  })
  it('catches a swapped label and requires a new owner label before transfer', () => {
    let s = identify(collect({ ...initialLuggage, phase: 1 }))
    s = sendLuggage({ ...s, collector: 1 }); expect(s.moving).toBe(false); expect(s.feedback).toMatch(/different owner/)
    s = labelLuggage({ ...s, label: 1 }); expect(s.tags[1]).toBe(1); expect(sendLuggage(s).moving).toBe(true)
  })
  it('keeps ownership separate from a friend collecting and from unsupported guesses', () => {
    let s = identify(continueLuggage(collect(collect({ ...initialLuggage, phase: 1 }))))
    s = { ...s, collector: 3 }; expect(sendLuggage(s).moving).toBe(false)
    s = askLuggage(s, 1); s = labelLuggage({ ...s, label: 3 })
    expect(sendLuggage(s).moving).toBe(false)
    s = labelLuggage({ ...s, label: 2 }); expect(sendLuggage(s).moving).toBe(true)
  })
  it('changes the evidence rule for a sealed gift and never opens its pocket', () => {
    let s = takeLuggage({ ...initialLuggage, phase: 2, claim: 2 }, 2)
    s = openLuggagePocket(askLuggage(s, 0)); expect(s.pockets).toEqual([])
    expect(markLuggageFact(s, 5).evidence).toEqual([])
    s = inspectLuggage(s); s = markLuggageFact(markLuggageFact(s, 0), 1)
    expect(verifyLuggage(s).verified).toBe(-1)
    s = markLuggageFact(markLuggageFact(s, 2), 4)
    expect(verifyLuggage(s).verified).toBe(2)
  })
  it('keeps the teacher from acting on pupil objects and transfers an answer explicitly', () => {
    let s = askLuggage({ ...initialLuggage, phase: 1, mode: 'coop' }, 0)
    expect(s.partner).toBe(true); expect(s.asked).toEqual([]); expect(takeLuggage(s, 0)).toEqual(s)
    s = answerLuggage(s); expect(s.partner).toBe(false); expect(s.asked).toEqual([0])
  })
  it('does not change a bag during transfer or give the same bag out twice', () => {
    let s = sendLuggage({ ...identify({ ...initialLuggage, phase: 1 }), collector: 0 })
    expect(takeLuggage(s, 1)).toEqual(s); expect(storeLuggage(s, true)).toEqual(s)
    for (let i = 0; i < 3; i++) s = luggageTransferStep(s)
    expect(takeLuggage(s, 0)).toEqual(s); expect(luggageOnBelt(s)).not.toContain(0)
  })
})
