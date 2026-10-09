import { describe, expect, it } from 'vitest'
import { defenseExercise, defenseLessons } from './content'
import { DefenseSession, defenseMissions, pathPosition, type DefenseMission } from './session'

function deployed(mission: DefenseMission = 'watch') {
  const s = new DefenseSession('seven', false, mission)
  s.selectBuild(0); s.placeTower(0); s.selectBuild(0); s.placeTower(2)
  return s
}
function solve(s: DefenseSession, tower = 0) { s.chooseTower(tower); s.answer(s.exercise.correctIndex); s.continue() }
function battle() { const s = deployed(); s.start(); solve(s); solve(s, 1); s.launch(); return s }
function ticks(s: DefenseSession, seconds: number) { for (let i = 0; i < seconds * 10; i++) s.tick(.1) }

describe('education-led tower defense', () => {
  it('spends kits on chosen types, allows duplicates, prevents overlap and refunds investments', () => {
    const s = new DefenseSession(); s.start(); expect(s.status).toBe('ready')
    s.selectBuild(2); s.placeTower(3); s.selectBuild(2); s.placeTower(3)
    expect(s.placements).toEqual([3, -1, -1, -1, -1, -1]); expect(s.kits).toBe(1)
    s.placeTower(1); expect(s.types.slice(0, 2)).toEqual([2, 2]); expect(s.kits).toBe(0)
    s.selectBuild(0); s.placeTower(4); expect(s.placements.filter(n => n >= 0)).toHaveLength(2)
    s.removeTower(0); expect(s.kits).toBe(1); s.upgradeTower(1); expect(s.kits).toBe(0)
    s.removeTower(1); expect(s.kits).toBe(2)
  })
  it('moves without cost, limits upgrades, and cannot recharge by replacing type', () => {
    const s = deployed(); s.start(); solve(s); solve(s)
    s.selectPlacement(0); s.placeTower(4); expect(s.kits).toBe(2)
    s.upgradeTower(0); s.upgradeTower(0); s.upgradeTower(0); expect(s.levels[0]).toBe(3); expect(s.kits).toBe(0)
    s.replaceTower(0, 1); expect(s.levels[0]).toBe(1); expect(s.energy[0]).toBe(0); expect(s.kits).toBe(2)
    s.beginRecharge(0); s.answerRecharge(s.rechargeExercise.correctIndex); s.launch()
    s.removeTower(0); s.replaceTower(0, 2); s.selectPlacement(0); s.placeTower(3)
    expect(s.placements[0]).toBe(4); expect(s.types[0]).toBe(1)
  })
  it('requires placement, two tasks and available energy to launch', () => {
    const s = deployed(); s.launch(); s.chooseTower(0); expect(s.status).toBe('ready')
    s.start(); s.launch(); expect(s.status).toBe('choosing'); solve(s); s.launch(); expect(s.status).toBe('choosing')
    solve(s, 1); expect(s.status).toBe('wave-ready'); s.energy.fill(0); s.launch(); expect(s.status).toBe('wave-ready')
    s.beginRecharge(0); s.answerRecharge(s.rechargeExercise.correctIndex); s.launch(); expect(s.status).toBe('wave')
  })
  it('awards energy and a kit once and fixes the selected tower during a task', () => {
    const s = deployed(); s.start(); s.chooseTower(0); s.selectTower(1); s.answer(s.exercise.correctIndex); s.answer(s.exercise.correctIndex)
    expect(s.results).toHaveLength(1); expect(s.independent).toBe(1); expect(s.energy.slice(0, 2)).toEqual([60, 0]); expect(s.kits).toBe(1); expect(s.levels[0]).toBe(1)
  })
  it.each(['wrong', 'hint'])('requires an analogous task after %s and counts assistance', action => {
    const s = deployed(); s.start(); s.chooseTower(1); const prompt = s.exercise.prompt
    if (action === 'wrong') s.answer((s.exercise.correctIndex + 1) % 3); else s.hint()
    expect(s.status).toBe('explanation'); expect(s.kits).toBe(0); expect(s.results).toHaveLength(0)
    s.continue(); expect(s.exercise.prompt).not.toBe(prompt); s.answer(s.exercise.correctIndex)
    expect(s.results[0].firstTry).toBe(false); expect(s.reviewPrompts).toEqual([prompt]); expect(s.errors).toBe(action === 'wrong' ? 1 : 0)
  })
  it('uses energy per shot, slows timed charging and rejects repeated wrong answers', () => {
    const s = battle(); ticks(s, 5); expect(s.energy[0]).toBeLessThan(60); s.energy[0] = 0; s.beginRecharge(0)
    const before = s.waveTime; s.tick(.1); expect(s.waveTime - before).toBeCloseTo(.035)
    const wrong = (s.rechargeExercise.correctIndex + 1) % 3; s.answerRecharge(wrong); s.answerRecharge(wrong)
    expect(s.energy[0]).toBe(0); expect(s.errors).toBe(1)
    s.answerRecharge(s.rechargeExercise.correctIndex); s.answerRecharge(0)
    expect(s.energy[0]).toBe(60); expect(s.rechargeSolved).toBe(1); expect(s.chargeIndependent).toBe(0); expect(s.reviewPrompts).toHaveLength(1)
  })
  it('pauses simulation and input including the active charge', () => {
    const s = battle(); s.beginRecharge(1); s.tick(.1); s.pause(); const before = s.serialize()
    s.tick(.1); s.answerRecharge(s.rechargeExercise.correctIndex); s.continue(); s.launch(); s.closeRecharge()
    expect(s.serialize()).toBe(before); s.resume(); s.tick(.1); expect(s.recharge!.remaining).toBeLessThan(11.9)
  })
  it('calm mode and explanations freeze movement and timer; a hint requires an analogous task', () => {
    const s = battle(); s.mode = 'calm'; s.beginRecharge(0); ticks(s, 20)
    expect(s.waveTime).toBe(0); expect(s.recharge!.remaining).toBe(12)
    s.mode = 'practice'; const prompt = s.rechargeExercise.prompt; s.hintRecharge(); ticks(s, 20); expect(s.waveTime).toBe(0)
    s.continueRecharge(); expect(s.rechargeExercise.prompt).not.toBe(prompt)
    s.answerRecharge(s.rechargeExercise.correctIndex); expect(s.chargeIndependent).toBe(0)
  })
  it('expires in 12 active seconds without reward and offers another question', () => {
    const s = battle(); s.energy[0] = 0; s.beginRecharge(0); ticks(s, 12.1)
    expect(s.recharge?.expired).toBe(true); s.answerRecharge(s.rechargeExercise.correctIndex)
    expect(s.energy[0]).toBe(0); expect(s.rechargeSolved).toBe(0)
    const prompt = s.rechargeExercise.prompt; s.nextRecharge(); expect(s.rechargeExercise.prompt).not.toBe(prompt)
    s.answerRecharge(s.rechargeExercise.correctIndex); expect(s.energy[0]).toBe(60)
  })
  it('retains a pending task after wave completion and awards once', () => {
    const s = battle(); s.spawned = s.totalAliens; s.beginRecharge(0); s.tick(.1)
    expect(s.status).toBe('between'); expect(s.recharge).not.toBeNull(); s.continue(); expect(s.status).toBe('between')
    s.answerRecharge(s.rechargeExercise.correctIndex); expect(s.rechargeSolved).toBe(1); s.continue(); expect(s.wave).toBe(2)
  })
  it('loses health, fails and retries the last checkpoint while retaining solved tasks', () => {
    const s = battle(); s.health = 5; s.spawned = s.totalAliens; s.energy.fill(0)
    s.aliens.push({ id: 2, progress: .9999, hp: 99, maxHp: 99, slow: 0 }); s.tick(.1)
    expect(s.status).toBe('defeated'); expect(s.health).toBe(0); s.retryWave()
    expect(s.status).toBe('wave-ready'); expect(s.health).toBe(100); expect(s.energy.slice(0, 2)).toEqual([60, 60]); expect(s.results).toHaveLength(2); expect(s.retries).toBe(1)
    s.selectPlacement(0); s.placeTower(4); expect(s.placements[0]).toBe(4)
  })
  it('pet blocks base damage once per wave; a second press cannot extend protection', () => {
    const s = battle(); s.protect(); ticks(s, 1); const remaining = s.petShield; s.protect(); expect(s.petShield).toBe(remaining)
    s.aliens.push({ id: 2, progress: .9999, hp: 99, maxHp: 99, slow: 0 }); s.tick(.1); expect(s.health).toBe(100)
    ticks(s, 5); s.aliens.push({ id: 2, progress: .9999, hp: 99, maxHp: 99, slow: 0 }); s.tick(.1); expect(s.health).toBe(82)
  })
  it('changes actual target priority and distinguishes cryo slow from pulse area damage', () => {
    for (const large of [false, true]) {
      const s = battle(); s.spawned = s.totalAliens; s.placements[0] = 1; s.placements[1] = -1; s.priorities[0] = large
      s.aliens.push({ id: 1, progress: .3, hp: 20, maxHp: 20, slow: 0 }, { id: 2, progress: .29, hp: 30, maxHp: 30, slow: 0 })
      s.tick(.01); expect(s.aliens[large ? 1 : 0].hp).toBe(large ? 28 : 18)
    }
    for (const type of [1, 2]) {
      const s = battle(); s.spawned = s.totalAliens; s.types[0] = type; s.placements[0] = 1; s.placements[1] = -1
      s.aliens.push({ id: 1, progress: .3, hp: 30, maxHp: 30, slow: 0 }, { id: 2, progress: .31, hp: 30, maxHp: 30, slow: 0 })
      s.tick(.01)
      if (type === 1) expect(s.aliens.some(alien => alien.slow > 0)).toBe(true)
      else expect(s.aliens.every(alien => alien.hp === 28)).toBe(true)
    }
  })
  it.each(defenseMissions.map(m => m.id))('finishes %s with six prep tasks and necessary charging', mission => {
    const s = deployed(mission); s.start()
    for (let wave = 1; wave <= 3; wave++) {
      solve(s); solve(s, 1); s.upgradeTower(0); s.upgradeTower(1); s.launch()
      for (let i = 0; i < 1800 && s.status === 'wave'; i++) {
        // Four seconds to notice and solve each low-battery task.
        if (!s.recharge) { const low = s.energy.findIndex((n, j) => s.placements[j] >= 0 && n < 24); if (low >= 0) s.beginRecharge(low) }
        else if (s.recharge.remaining < 8) s.answerRecharge(s.rechargeExercise.correctIndex)
        s.tick(.1)
      }
      expect(s.status).toBe(wave === 3 ? 'finished' : 'between'); expect(s.waveTime).toBeLessThan(65)
      if (s.recharge) s.answerRecharge(s.rechargeExercise.correctIndex)
      if (wave < 3) s.continue()
    }
    expect(s.results).toHaveLength(6); expect(s.rechargeSolved).toBeGreaterThan(0); expect(s.health).toBeGreaterThan(0)
  })
  it('cannot finish a hard mission without charging or upgrades', () => {
    const s = deployed('giant'); s.start()
    for (let wave = 1; wave <= 3; wave++) { solve(s); solve(s, 1); s.launch(); ticks(s, 80); if (s.status === 'defeated') break; s.continue() }
    expect(s.status).toBe('defeated')
  })
  it.each(['question', 'charge', 'hint', 'between', 'finished', 'defeated'])('restores %s without changing the task or progress', state => {
    const s = battle()
    if (state === 'question') { s.status = 'choosing'; s.chooseTower(1); s.hint(); s.continue() }
    else if (state === 'charge' || state === 'hint') { s.beginRecharge(0); ticks(s, 3); if (state === 'hint') s.hintRecharge() }
    else s.status = state as 'between' | 'finished' | 'defeated'
    const restored = DefenseSession.restore(s.serialize(), 'seven', false, 'watch', 1)!
    expect(restored).not.toBeNull(); if (!['finished', 'defeated'].includes(state)) { expect(restored.status).toBe('paused'); restored.resume() }
    expect(restored.snapshot()).toEqual(s.snapshot()); expect(restored.exercise).toEqual(s.exercise); expect(restored.recharge).toEqual(s.recharge); expect(restored.results).toEqual(s.results)
  })
  it('rejects incompatible and damaged saves', () => {
    const raw = battle().serialize(); expect(DefenseSession.restore(raw, 'linear', false, 'watch', 1)).toBeNull()
    for (const invalid of ['{', '{}', raw.replace('"health":100', '"health":900'), raw.replace('"placements":[0,2', '"placements":[0,0'), raw.replace('"recharge":null,', '')]) expect(DefenseSession.restore(invalid, 'seven', false, 'watch', 1)).toBeNull()
  })
  it('rejects invalid choices and caps delta so a browser stall cannot skip a wave', () => {
    const s = deployed(); s.start(); s.chooseTower(-1); s.chooseTower(.5); expect(s.status).toBe('choosing')
    s.chooseTower(0); s.answer(NaN); s.answer(3); expect(s.status).toBe('question')
    s.answer(s.exercise.correctIndex); s.continue(); solve(s); s.launch(); s.tick(NaN); expect(s.waveTime).toBe(0); s.tick(500); expect(s.waveTime).toBe(.1)
  })
  it('generates distinct answers, analogous recovery items and correct algebra and fractions', () => {
    for (const lesson of defenseLessons) for (const home of [false, true]) for (let index = 0; index < 6; index++) for (let recovery = 0; recovery < 8; recovery++) {
      const item = defenseExercise(lesson.id, home, index, recovery), value = Number(item.options[item.correctIndex])
      expect(new Set(item.options).size).toBe(3); expect(item.options[item.correctIndex]).toBeTruthy()
      expect(defenseExercise(lesson.id, home, index, recovery + 1).prompt).not.toBe(item.prompt)
      if (lesson.id === 'linear') { const [a, b, c] = item.prompt.match(/\d+/g)!.map(Number); expect(a * value + b).toBe(c) }
      if (lesson.id === 'fractions') { const n = item.prompt.match(/\d+/g)!.map(Number); expect(value).toBe(item.prompt.startsWith('Find') ? n[0] / n[1] * n[2] : n[1] * n[2]) }
    }
    expect(new DefenseSession('seven', true, 'watch', 2).exercise.prompt).not.toBe(new DefenseSession('seven', true).exercise.prompt)
  })
  it('keeps the illustrated road continuous from portal to base', () => {
    const points = Array.from({ length: 201 }, (_, i) => pathPosition(i / 200))
    const length = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.z - points[i].z), 0)
    expect(length).toBeGreaterThan(24); expect(pathPosition(0).z).toBeCloseTo(-7.94); expect(pathPosition(1).z).toBeCloseTo(6.16)
    for (let i = 1; i < points.length; i++) expect(Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)).toBeLessThan(.3)
  })
})
