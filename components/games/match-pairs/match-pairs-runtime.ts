import type PhaserType from 'phaser'
import type {
  MatchPairsRuntimeLayout,
  PhaserRuntimeFactory,
  RuntimePoint,
} from '@/lib/game-runtime/contracts'
import { resolveThemeManifest, type ThemeManifest } from '@/lib/theme-manifests'
import { MatchPairsSoundKit } from './match-pairs-sound'

type MatchFeedback = {
  correct: boolean
  leftIndex: number
  rightIndex: number
  startedAt: number
}

type Graphics = PhaserType.GameObjects.Graphics
const PARTICLE_TEXTURE = 'match-pairs-soft-particle'

export const createMatchPairsRuntime: PhaserRuntimeFactory = ({
  Phaser,
  parent,
  bridge,
}) => {
  class MatchPairsEffectsScene extends Phaser.Scene {
    private ambient!: Graphics
    private lines!: Graphics
    private feedbackFx!: Graphics
    private particles!: PhaserType.GameObjects.Particles.ParticleEmitter
    private layout: MatchPairsRuntimeLayout | null = null
    private drag: { leftIndex: number; point: RuntimePoint } | null = null
    private feedback: MatchFeedback | null = null
    private completeStartedAt: number | null = null
    private completed = false
    private reducedMotion = false
    private manifest: ThemeManifest = resolveThemeManifest('corgi-classic')
    private soundKit = new MatchPairsSoundKit()
    private disposed = false
    private unsubscribe: (() => boolean) | null = null

    constructor() {
      super('match-pairs-effects')
    }

    create() {
      this.ambient = this.add.graphics()
      this.lines = this.add.graphics()
      this.feedbackFx = this.add.graphics()
      this.createParticleTexture()
      this.particles = this.add.particles(0, 0, PARTICLE_TEXTURE, {
        emitting: false,
        reserve: 64,
        maxParticles: 96,
        lifespan: { min: 380, max: 545 },
        speed: { min: 28, max: 56 },
        angle: { min: 0, max: 360 },
        gravityY: 420,
        scale: { start: 0.7, end: 0.42 },
        alpha: { start: 0.86, end: 0 },
        tint: [
          hexToNumber(this.manifest.palette.success),
          hexToNumber(this.manifest.palette.accent),
        ],
      })

      this.unsubscribe = bridge.subscribeCommands((command) => {
        if (this.disposed) return
        if (command.type === 'runtime/pause') {
          this.soundKit.configure({ paused: true })
          return
        }

        if (command.type === 'runtime/resume') {
          this.soundKit.configure({ paused: false })
          return
        }

        if (command.type === 'runtime/destroy') {
          this.soundKit.dispose()
          return
        }

        if (command.type === 'runtime/reduced-motion') {
          this.reducedMotion = command.enabled
          this.soundKit.configure({ reducedMotion: command.enabled })
          this.particles.setParticleGravity(0, command.enabled ? 0 : 420)
          if (command.enabled) {
            this.particles.forEachAlive((particle) => {
              particle.velocityX = 0
              particle.velocityY = 0
              particle.accelerationX = 0
              particle.accelerationY = 0
            }, this)
          }
          return
        }

        if (command.type === 'match/sound-config') {
          this.reducedMotion = command.reducedMotion
          this.soundKit.configure({
            muted: command.muted,
            paused: command.paused,
            reducedMotion: command.reducedMotion,
          })
          return
        }

        if (command.type === 'match/tap') {
          this.soundKit.play('tap')
          return
        }

        if (command.type === 'match/theme') {
          this.manifest = resolveThemeManifest(command.themeId)
          return
        }

        if (command.type === 'match/layout') {
          this.layout = command.layout
          if (command.layout.connections.length < command.layout.left.length) {
            this.completed = false
            this.completeStartedAt = null
          }
          return
        }

        if (command.type === 'match/drag') {
          const started = Boolean(command.point && !this.drag)
          this.drag = command.point
            ? { leftIndex: command.leftIndex, point: command.point }
            : null
          if (started) this.soundKit.play('drag')
          return
        }

        if (command.type === 'match/feedback') {
          this.feedback = {
            correct: command.correct,
            leftIndex: command.leftIndex,
            rightIndex: command.rightIndex,
            startedAt: this.time.now,
          }
          this.soundKit.play(command.correct ? 'correct' : 'wrong')
          this.createFeedbackBurst(command.correct, command.leftIndex, command.rightIndex)

          return
        }

        if (command.type === 'match/complete') {
          this.completed = true
          this.completeStartedAt = this.time.now
          this.soundKit.play('complete')
          this.createCompletionBurst()
        }
      })

      const dispose = () => {
        if (this.disposed) return
        this.disposed = true
        this.unsubscribe?.()
        this.unsubscribe = null
        this.soundKit.dispose()
        this.particles.killAll()
      }

      this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose)
      this.events.once(Phaser.Scenes.Events.DESTROY, dispose)
    }

    update(time: number) {
      this.drawAmbient(time)
      this.drawConnections(time)
      this.updateAndDrawFeedback(time)
    }

    private createParticleTexture() {
      if (this.textures.exists(PARTICLE_TEXTURE)) return
      const texture = this.add.graphics()
      texture.fillStyle(0xffffff, 1)
      texture.fillCircle(6, 6, 5)
      texture.generateTexture(PARTICLE_TEXTURE, 12, 12)
      texture.destroy()
    }

    private drawAmbient(time: number) {
      this.ambient.clear()
      const layout = this.layout
      if (!layout) return

      const palette = this.manifest.palette
      const accent = hexToNumber(palette.accent)
      const alternate = hexToNumber(palette.accentAlt)
      const bubbleCount = this.reducedMotion ? 7 : 16
      const speed = this.manifest.motion.ambientSpeed

      for (let index = 0; index < bubbleCount; index += 1) {
        const xBase = ((index * 173 + 61) % 997) / 997
        const yBase = ((index * 277 + 89) % 991) / 991
        const drift = this.reducedMotion
          ? 0
          : Math.sin(time * 0.00028 * speed + index * 1.7) * (7 + (index % 4) * 2)
        const rise = this.reducedMotion
          ? 0
          : (time * 0.0065 * speed * (1 + (index % 3) * 0.25)) % (layout.height + 80)
        const x = xBase * layout.width + drift
        const y = (yBase * layout.height - rise + layout.height + 40) % (layout.height + 80) - 40
        const radius = 1.6 + (index % 4) * 0.85
        const color = index % 3 === 0 ? alternate : accent
        const alpha = this.manifest.id === 'deep-sea' ? 0.18 : 0.09

        this.ambient.fillStyle(color, alpha)
        this.ambient.fillCircle(x, y, radius)

        if (this.manifest.id === 'deep-sea' && index % 2 === 0) {
          this.ambient.lineStyle(1, color, 0.2)
          this.ambient.strokeCircle(x, y, radius + 2.4)
        }
      }
    }

    private drawConnections(time: number) {
      this.lines.clear()
      const layout = this.layout
      if (!layout) return

      const palette = this.manifest.palette
      const success = hexToNumber(palette.success)
      const accent = hexToNumber(palette.accent)
      const shadow = hexToNumber(palette.shadow, 0x174456)
      const completionSettle = this.completed
        ? easeOutCubic(Math.min(1, (time - (this.completeStartedAt ?? time)) / 620))
        : 0
      const shadowAlpha = 0.12 - completionSettle * 0.055
      const mainAlpha = 0.94 - completionSettle * 0.36
      const highlightAlpha = 0.25 - completionSettle * 0.15

      layout.connections.forEach((connection, index) => {
        const start = layout.left[connection.leftIndex]
        const end = layout.right[connection.rightIndex]
        if (!start || !end) return

        const curve = getBezierCurve(Phaser, start, end)
        strokeCurve(this.lines, curve, shadow, 11, shadowAlpha)
        strokeCurve(this.lines, curve, success, 4.5, mainAlpha)
        strokeCurve(this.lines, curve, 0xffffff, 1, highlightAlpha)

        if (!this.completed) {
          const phase = this.reducedMotion ? 0.72 : (time / 1450 + index * 0.23) % 1
          const pulse = curve.getPoint(phase)
          this.lines.fillStyle(success, 0.13)
          this.lines.fillCircle(pulse.x, pulse.y, 7)
          this.lines.fillStyle(0xffffff, 0.82)
          this.lines.fillCircle(pulse.x, pulse.y, 1.9)
        }
      })

      if (this.drag) {
        const start = layout.left[this.drag.leftIndex]
        if (!start) return

        const curve = getBezierCurve(Phaser, start, this.drag.point)
        strokeCurve(this.lines, curve, shadow, 12, 0.1)
        strokeCurve(this.lines, curve, accent, 4.5, 0.95)
        strokeCurve(this.lines, curve, 0xffffff, 1, 0.3)
        this.lines.fillStyle(accent, 0.2)
        this.lines.fillCircle(this.drag.point.x, this.drag.point.y, 10)
        this.lines.lineStyle(2, 0xffffff, 0.7)
        this.lines.strokeCircle(this.drag.point.x, this.drag.point.y, 6)
      }
    }

    private updateAndDrawFeedback(time: number) {
      this.feedbackFx.clear()
      const layout = this.layout
      if (!layout) return

      if (this.feedback) {
        const duration = this.manifest.motion.feedbackDurationMs
        const progress = Math.min(1, (time - this.feedback.startedAt) / duration)
        const start = layout.left[this.feedback.leftIndex]
        const end = layout.right[this.feedback.rightIndex]

        if (start && end && progress < 1) {
          const color = hexToNumber(
            this.feedback.correct ? this.manifest.palette.success : this.manifest.palette.danger,
          )
          const recoil = this.feedback.correct || this.reducedMotion
            ? 0
            : Math.sin(progress * Math.PI * 7) * (1 - progress) * 7
          const animatedCurve = getBezierCurve(Phaser, start, end, recoil, -recoil)

          strokeCurve(this.feedbackFx, animatedCurve, color, 14 - progress * 7, (1 - progress) * 0.22)
          strokeCurve(this.feedbackFx, animatedCurve, color, 5, 1 - progress)
          const travellingPoint = animatedCurve.getPoint(easeOutCubic(progress))
          this.feedbackFx.fillStyle(0xffffff, 0.9 * (1 - progress))
          this.feedbackFx.fillCircle(travellingPoint.x, travellingPoint.y, 4.5)
        } else if (progress >= 1) {
          this.feedback = null
        }
      }

      this.drawCompletionConfetti(time, layout)
    }

    private createFeedbackBurst(correct: boolean, leftIndex: number, rightIndex: number) {
      const layout = this.layout
      const end = layout?.right[rightIndex]
      const start = layout?.left[leftIndex]
      if (!layout || !start || !end) return

      const origin = correct ? end : getBezierCurve(Phaser, start, end).getPoint(0.55)
      const primary = hexToNumber(
        correct ? this.manifest.palette.success : this.manifest.palette.danger,
      )
      const secondary = hexToNumber(
        correct ? this.manifest.palette.accent : this.manifest.palette.accentAlt,
      )
      const count = this.reducedMotion ? 5 : correct ? 18 : 9

      this.particles
        .setParticleLifespan({ min: 380, max: 545 })
        .setParticleSpeed(this.reducedMotion ? 0 : 44)
        .setEmitterAngle(correct ? { min: 195, max: 345 } : { min: 0, max: 360 })
        .setParticleGravity(0, this.reducedMotion ? 0 : 420)
        .setParticleAlpha({ start: 0.86, end: 0 })
        .setParticleTint([primary, primary, secondary])
      this.particles.explode(count, origin.x, origin.y)
    }

    private createCompletionBurst() {
      const layout = this.layout
      if (!layout) return

      const colors = [
        hexToNumber(this.manifest.palette.success),
        hexToNumber(this.manifest.palette.accent),
        hexToNumber(this.manifest.palette.accentAlt),
        0xffffff,
      ]
      const count = this.reducedMotion ? 10 : 30

      this.particles
        .setParticleLifespan({ min: 650, max: 1050 })
        .setParticleSpeed(this.reducedMotion ? 0 : 79)
        .setEmitterAngle({ min: 248, max: 292 })
        .setParticleGravity(0, this.reducedMotion ? 0 : 420)
        .setParticleAlpha({ start: 0.86, end: 0 })
        .setParticleTint(colors)
      for (let index = 0; index < count; index += 1) {
        const spread = ((index * 79) % 101) / 100
        this.particles.emitParticleAt(
          layout.width * (0.32 + spread * 0.36),
          layout.height * 0.54,
          1,
        )
      }
    }

    private drawCompletionConfetti(time: number, layout: MatchPairsRuntimeLayout) {
      if (this.completeStartedAt === null) return
      const elapsed = time - this.completeStartedAt
      if (elapsed > 1800) {
        return
      }

      const alpha = Math.max(0, 1 - elapsed / 1800)
      const colors = [
        hexToNumber(this.manifest.palette.success),
        hexToNumber(this.manifest.palette.accent),
        hexToNumber(this.manifest.palette.accentAlt),
      ]
      const count = this.reducedMotion ? 7 : 18

      for (let index = 0; index < count; index += 1) {
        const x = (((index * 137) % 997) / 997) * layout.width
        const fall = this.reducedMotion ? 0 : elapsed * (0.055 + (index % 4) * 0.009)
        const y = (((index * 223) % 887) / 887) * layout.height * 0.35 + fall
        this.feedbackFx.fillStyle(colors[index % colors.length], alpha * 0.7)
        this.feedbackFx.fillCircle(x, y, 2.5 + (index % 3))
      }
    }
  }

  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: Math.max(1, parent.clientWidth),
    height: Math.max(1, parent.clientHeight),
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    scene: [MatchPairsEffectsScene],
    audio: { noAudio: true },
    banner: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
  })
}

function getBezierCurve(
  Phaser: typeof PhaserType,
  start: RuntimePoint,
  end: RuntimePoint,
  controlYOffsetA = 0,
  controlYOffsetB = 0,
) {
  const handle = Math.max(68, Math.abs(end.x - start.x) * 0.46)
  return new Phaser.Curves.CubicBezier(
    new Phaser.Math.Vector2(start.x, start.y),
    new Phaser.Math.Vector2(start.x + handle, start.y + controlYOffsetA),
    new Phaser.Math.Vector2(end.x - handle, end.y + controlYOffsetB),
    new Phaser.Math.Vector2(end.x, end.y),
  )
}

function strokeCurve(
  graphics: Graphics,
  curve: PhaserType.Curves.CubicBezier,
  color: number,
  width: number,
  alpha: number,
) {
  graphics.lineStyle(width, color, alpha)
  curve.draw(graphics, 28)
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function hexToNumber(color: string, fallback = 0x159c91) {
  const match = color.match(/^#([\da-f]{6})$/i)
  return match ? Number.parseInt(match[1], 16) : fallback
}
