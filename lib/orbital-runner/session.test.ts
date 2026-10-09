import { describe, expect, it } from 'vitest'
import { createRunnerCourse, RunnerSession, laneWidth, checkpointSpacing } from './session'
import { validateLearningGameQuestions as validateRunnerQuestions } from '../learning-game-content'

const question = { id: 'q', prompt: '7 × 8', options: ['54', '56', '64'], correctIndex: 1, explanation: '7 × 8 = 56.' }
const advance = (session: RunnerSession, distance: number) => {
  while (session.distance < distance && session.status === 'playing') session.tick(.02)
}

describe('orbital runner rules', () => {
  it('leaves an open lane at every obstacle row and clear checkpoint approaches', () => {
    const course = createRunnerCourse(5)
    const obstacles = course.filter(item => item.kind !== 'coin')
    for (const distance of new Set(obstacles.map(item => item.distance))) {
      expect(new Set(obstacles.filter(item => item.distance === distance).map(item => item.lane)).size).toBeLessThan(3)
      expect(distance % checkpointSpacing).toBeLessThan(28)
    }
    expect(new Set(course.map(item => item.id)).size).toBe(course.length)
  })

  it('requires an explicit start, bounds lane changes, and moves continuously', () => {
    const session = new RunnerSession([question])
    session.tick(1); session.command('left')
    expect(session.distance).toBe(0); expect(session.lane).toBe(0)
    session.start(); session.command('right'); session.command('right'); session.tick(.02)
    expect(session.lane).toBe(1); expect(session.x).toBeGreaterThan(0); expect(session.x).toBeLessThan(laneWidth)
    session.command('left'); session.command('left'); session.command('left')
    expect(session.lane).toBe(-1)
  })

  it('freezes distance, jump phase, and invulnerability while paused', () => {
    const session = new RunnerSession([question]); session.start(); session.command('jump'); session.tick(.1)
    session.pause(); const state = [session.distance, session.actionTime, session.invulnerable]
    session.command('right'); session.tick(1)
    expect([session.distance, session.actionTime, session.invulnerable]).toEqual(state)
    expect(session.lane).toBe(0)
    session.resume(); session.tick(.1); expect(session.distance).toBeGreaterThan(state[0])
  })

  it('respects physics equally at 30 and 120 FPS and limits long hidden-tab frames', () => {
    const a = new RunnerSession([question]), b = new RunnerSession([question]); a.start(); b.start()
    for (let i = 0; i < 120; i++) a.tick(1 / 120)
    for (let i = 0; i < 30; i++) b.tick(1 / 30)
    expect(a.distance).toBeCloseTo(b.distance, 8)
    a.tick(300); expect(a.distance).toBeLessThan(9)
    const distance = a.distance; a.tick(NaN); a.tick(-1); expect(a.distance).toBe(distance)
  })

  it('clears a low hurdle with a timed jump while a grounded runner collides once', () => {
    const jumper = new RunnerSession([question]); jumper.start(); jumper.command('left'); advance(jumper, 11)
    jumper.command('jump'); advance(jumper, 16)
    expect(jumper.collisions).toBe(0)
    const grounded = new RunnerSession([question]); grounded.start(); grounded.command('left'); advance(grounded, 16)
    expect(grounded.collisions).toBe(1); expect(grounded.lives).toBe(2)
  })

  it('clears an overhead beam only with a timed slide', () => {
    const slider = new RunnerSession([question]); slider.start(); advance(slider, 21)
    slider.command('slide'); advance(slider, 26)
    expect(slider.collisions).toBe(0)
    const upright = new RunnerSession([question]); upright.start(); advance(upright, 26)
    expect(upright.collisions).toBe(1)
  })

  it('does not let a jump pass through a cargo crate', () => {
    const session = new RunnerSession([question, { ...question, id: 'q2' }]); session.start()
    advance(session, 18); session.command('left'); advance(session, 28)
    session.command('right'); advance(session, 40); session.selectLane(2); advance(session, 61)
    session.command('jump'); advance(session, 66)
    expect(session.collisions).toBe(1)
  })

  it('keeps running through all levels and removes one life for a wrong answer', () => {
    const session = new RunnerSession(Array.from({length:5}, (_, index) => ({...question,id:`q${index}`})), { obstacles: false, pace: 'calm' })
    session.start()
    for (let section = 0; section < 5; section++) {
      expect(session.status).toBe('playing')
      session.selectLane(section ? 1 : 0); advance(session, (section + 1) * checkpointSpacing)
      expect(session.answered).toBe(section + 1); expect(session.selectedAnswer).toBe(section ? 1 : 0)
      if (section < 4) { const distance = session.distance; session.tick(.1); expect(session.distance).toBeGreaterThan(distance) }
    }
    expect(session.status).toBe('finished'); expect(session.correct).toBe(4); expect(session.lives).toBe(2); expect(session.level).toBe(3)
    expect(session.coins).toBeGreaterThan(0)
    expect(session.incorrectQuestions.map(question => question.id)).toEqual(['q0'])
    session.tick(.1); expect(session.distance).toBe(200)
  })
  it('ends the run after three wrong gates without counting them as obstacle collisions', () => {
    const session = new RunnerSession(Array.from({length:4}, (_, index) => ({...question,id:`q${index}`})), { obstacles:false, pace:'calm' })
    session.selectLane(0); session.start(); advance(session, 160)
    expect(session.status).toBe('gameover'); expect(session.lives).toBe(0); expect(session.answered).toBe(3); expect(session.collisions).toBe(0)
  })

  it('does not accept a late lane command as an instant teleport to the answer', () => {
    const session = new RunnerSession([{ ...question, correctIndex: 2 }], { obstacles: false, pace: 'normal' })
    session.start(); advance(session, 39.9); session.command('right'); advance(session, 40)
    expect(session.selectedAnswer).toBe(1); expect(session.correct).toBe(0)
    const repeat = new RunnerSession(session.incorrectQuestions)
    expect(repeat.question.id).toBe(question.id); expect(repeat.questionCount).toBe(1)
  })

  it('rejects invalid task packets and does not silently trim options', () => {
    expect(() => validateRunnerQuestions([])).toThrow()
    expect(() => validateRunnerQuestions([{...question, options:['a','b']}])).toThrow()
    expect(() => validateRunnerQuestions([{...question, correctIndex:3}])).toThrow()
    expect(() => validateRunnerQuestions([question, question])).toThrow()
    expect(() => validateRunnerQuestions([{...question, prompt:' '}])).toThrow()
  })
})
