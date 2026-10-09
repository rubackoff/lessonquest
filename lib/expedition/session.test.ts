import { describe, it, expect } from 'vitest'
import { ExpeditionSession } from './session'
import { edgeAnchors, expeditionTopics, type Edge, type Route, type ExpeditionTopic } from './content'

function build(topic: ExpeditionTopic = 'triangle', route: Route = 'direct', homework = false, chapter = 1) {
  const s = new ExpeditionSession(topic, homework, chapter); s.inspect(); s.choosePlan(route); return s
}
function place(s: ExpeditionSession, length: number, edge: Edge, direction: number) {
  s.selectMaterial(length); while (s.direction !== direction) s.rotate()
  s.anchor(edgeAnchors[edge][0]); s.anchor(edgeAnchors[edge][1])
}
function predict(s: ExpeditionSession, answer: string) { s.predict(); s.setPrediction(answer); s.test() }

describe('expedition construction', () => {
  it('starts with observation, then plan, and never starts walking without a passed test', () => {
    const s = new ExpeditionSession(); s.cross(); s.test(); s.anchor('a'); expect(s.phase).toBe('inspect')
    s.inspect(); expect(s.phase).toBe('plan'); s.choosePlan('direct'); expect(s.phase).toBe('building')
    s.predict(); expect(s.phase).toBe('building'); expect(s.attempts).toHaveLength(0)
  })
  it('accepts the 6–8–10 bridge and moves the team only after an explicit action', () => {
    const s = build(); place(s, 10, 'ab', 2); predict(s, '10')
    expect(s.phase).toBe('passed'); expect(s.independent).toBe(true); expect(s.crossing).toBe(0)
    s.test(); expect(s.attempts).toHaveLength(1); s.cross(); for (let i = 0; i < 71; i++) s.tick(.1)
    expect(s.phase).toBe('finished')
  })
  it('distinguishes the 14 m detour from the straight bridge and keeps the bad construction for correction', () => {
    const s = build(); place(s, 14, 'ab', 2); predict(s, '14')
    expect(s.phase).toBe('failed'); expect(s.issues[0].message).toContain('detour'); expect(s.draft.parts).toHaveLength(1)
    s.edit(); s.selectPart(s.draft.parts[0].id); s.remove(); place(s, 10, 'ab', 2); predict(s, '10')
    expect(s.phase).toBe('passed'); expect(s.independent).toBe(false); expect(s.mathErrors).toBe(1)
  })
  it('accepts the two-support route but still requires the direct-distance calculation', () => {
    const s = build('triangle', 'via'); place(s, 6, 'ac', 0); place(s, 8, 'cb', 1); predict(s, '14'); expect(s.phase).toBe('failed')
    s.edit(); predict(s, '10'); expect(s.phase).toBe('passed')
  })
  it('does not call a wrong orientation or stray anchor click a mathematical error', () => {
    const s = build(); s.selectMaterial(10); s.anchor('a'); s.anchor('c'); expect(s.attempts).toHaveLength(0)
    place(s, 10, 'ab', 0); predict(s, '10'); expect(s.phase).toBe('failed'); expect(s.mathErrors).toBe(0)
    s.edit(); s.selectPart(s.draft.parts[0].id); s.rotate(); s.rotate(); predict(s, '10')
    expect(s.phase).toBe('passed'); expect(s.independent).toBe(true)
  })
  it('honors inventory, returns removed pieces and restores changes with undo and redo', () => {
    const s = build(); place(s, 10, 'ab', 2); s.selectMaterial(10); s.anchor('a'); s.anchor('b'); expect(s.draft.parts).toHaveLength(1)
    expect(s.materials.find(m => m.length === 10)!.remaining).toBe(0)
    s.undo(); expect(s.draft.parts).toHaveLength(0); expect(s.materials.find(m => m.length === 10)!.remaining).toBe(1)
    s.redo(); expect(s.draft.parts).toHaveLength(1); s.selectPart(s.draft.parts[0].id); s.remove(); expect(s.draft.parts).toHaveLength(0)
    s.undo(); expect(s.draft.parts).toHaveLength(1); s.resetDraft(); expect(s.draft.parts).toHaveLength(0); s.undo(); expect(s.draft.parts).toHaveLength(1)
  })
  it('reverse endpoint order creates the same connection', () => {
    const s = build(); s.selectMaterial(10); s.rotate(); s.rotate(); s.anchor('b'); s.anchor('a'); predict(s, '10'); expect(s.phase).toBe('passed')
  })
  it.each([[2, 4, 3, 5], [3, 3, 4, 4], [4, 2, 5, 3]])('accepts multiple segment constructions: %j', (a, b, c, d) => {
    const s = build('segments', 'via'); place(s, a, 'ac', 0); place(s, b, 'ac', 0); place(s, c, 'cb', 1); place(s, d, 'cb', 1)
    predict(s, '14'); expect(s.phase).toBe('passed')
  })
  it('keeps wrong segment sums as a mathematical error even if the total route sum happens to match', () => {
    const s = build('segments', 'via'); place(s, 4, 'ac', 0); place(s, 4, 'ac', 0); place(s, 3, 'cb', 1); place(s, 3, 'cb', 1)
    predict(s, '14'); expect(s.phase).toBe('failed'); expect(s.issues).toHaveLength(2)
  })
  it.each([[4, 6], [6, 4]])('accepts a %j × %j camp platform', (width, height) => {
    const s = build('area', 'via'); s.setSide('width', width); s.setSide('height', height); s.anchor('c'); predict(s, '20')
    expect(s.phase).toBe('passed')
  })
  it('checks perimeter independently of the correct area and supports rotating the platform', () => {
    const s = build('area', 'via'); s.setSide('width', 3); s.setSide('height', 8); s.placePlatform(); predict(s, '22')
    expect(s.phase).toBe('failed'); expect(s.issues).toHaveLength(1); expect(s.issues[0].message).toContain('fence')
    s.edit(); s.setSide('width', 4); s.setSide('height', 6); s.placePlatform(); s.rotate(); expect(s.draft.platform).toEqual({ width: 6, height: 4 }); predict(s, '20'); expect(s.phase).toBe('passed')
  })
  it('converts centimetres and map scale to real metres', () => {
    const s = build('scale', 'direct', true, 1); expect(s.content.scale).toBe(300); place(s, 15, 'ab', 2); predict(s, '5'); expect(s.phase).toBe('failed')
    s.edit(); predict(s, '15'); expect(s.phase).toBe('passed')
  })
  it('does not record unfinished or malformed numeric input as an answer', () => {
    const s = build(); place(s, 10, 'ab', 2); s.predict()
    for (const invalid of ['', ' ', '10 m', '-1', 'Infinity', '1e1', '0']) { s.setPrediction(invalid); s.test(); expect(s.attempts).toHaveLength(0) }
    s.setPrediction('10,0'); s.test(); expect(s.phase).toBe('passed')
  })
  it('hints persist across correction and reset, and success after help is not independent', () => {
    const s = build(); s.hint(); s.hint(); s.resetDraft(); expect(s.hintLevel).toBe(2)
    place(s, 10, 'ab', 2); predict(s, '10'); expect(s.phase).toBe('passed'); expect(s.independent).toBe(false)
  })
  it('pause freezes building and travel; resuming keeps the same project', () => {
    const s = build(); s.pause(); const raw = s.serialize(); s.selectMaterial(10); s.anchor('a'); s.rotate(); s.resetDraft(); s.choosePlan('via'); expect(s.serialize()).toBe(raw)
    s.resume(); place(s, 10, 'ab', 2); predict(s, '10'); s.cross(); s.tick(.1); s.pause(); const progress = s.crossing; s.tick(999); expect(s.crossing).toBe(progress)
    s.resume(); s.tick(999); expect(s.crossing - progress).toBeCloseTo(.1 / 7)
  })
  it('restores a partial construction, undo history and prediction, then resumes explicitly', () => {
    const s = build('segments', 'via'); place(s, 2, 'ac', 0); place(s, 4, 'ac', 0); s.undo()
    const restored = ExpeditionSession.restore(s.serialize(), s.topic, false, 1)!; expect(restored.paused).toBe(true); restored.resume(); expect(restored.snapshot()).toEqual(s.snapshot())
    restored.redo(); expect(restored.draft.parts).toHaveLength(2)
  })
  it('restores attempts from an earlier route when the current project uses another route', () => {
    const s = build(); place(s, 12, 'ab', 2); predict(s, '12'); s.choosePlan('via'); place(s, 6, 'ac', 0)
    const restored = ExpeditionSession.restore(s.serialize(), 'triangle', false, 1)!; expect(restored).not.toBeNull(); expect(restored.attempts).toHaveLength(1); expect(restored.mathErrors).toBe(1)
  })
  it.each(['prediction', 'passed', 'crossing', 'finished'])('restores %s without giving another successful attempt', phase => {
    const s = build(); place(s, 10, 'ab', 2); s.predict(); s.setPrediction('10')
    if (phase !== 'prediction') s.test(); if (['crossing', 'finished'].includes(phase)) s.cross()
    if (phase === 'finished') for (let i = 0; i < 71; i++) s.tick(.1)
    const restored = ExpeditionSession.restore(s.serialize(), 'triangle', false, 1)!; expect(restored.phase).toBe(phase); expect(restored.attempts).toEqual(s.attempts)
  })
  it('rejects damaged saves and keeps topics and homework chapters separate', () => {
    const s = build(); place(s, 10, 'ab', 2); const raw = s.serialize()
    for (const value of ['{}', '{', raw.replace('"length":10', '"length":99'), raw.replace('"direction":2', '"direction":-1')]) expect(ExpeditionSession.restore(value, 'triangle', false, 1)).toBeNull()
    expect(ExpeditionSession.restore(raw, 'scale', false, 1)).toBeNull(); expect(ExpeditionSession.restore(raw, 'triangle', true, 1)).toBeNull()
  })
  it('provides new feasible values for all three homework chapters and all topics', () => {
    for (const { id } of expeditionTopics) for (let chapter = 1; chapter <= 3; chapter++) {
      const s = build(id, id === 'segments' || id === 'area' ? 'via' : 'direct', true, chapter), c = s.content
      expect(c.diagonal).not.toBe(10)
      if (id === 'area') { s.setSide('width', c.width); s.setSide('height', c.height); s.placePlatform(); predict(s, String(c.fence)) }
      else if (id === 'segments') {
        for (const edge of ['ac', 'cb'] as Edge[]) {
          const find = (remaining: number, chosen: number[]): number[] | null => {
            if (remaining === 0) return chosen
            for (const m of s.materials) if (m.length <= remaining && chosen.filter(n => n === m.length).length < m.remaining) { const next = find(remaining - m.length, [...chosen, m.length]); if (next) return next }
            return null
          }
          const lengths = find(s.edgeLength(edge), []); expect(lengths).not.toBeNull(); for (const n of lengths!) place(s, n, edge, edge === 'ac' ? 0 : 1)
        }
        predict(s, String(c.horizontal + c.vertical))
      } else { place(s, c.diagonal, 'ab', 2); predict(s, String(c.diagonal)) }
      expect(s.phase).toBe('passed')
    }
  })
})
