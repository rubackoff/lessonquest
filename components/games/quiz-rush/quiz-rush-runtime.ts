import type PhaserType from 'phaser'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { PhaserRuntimeFactory, RuntimePoint } from '@/lib/game-runtime/contracts'

export type QuizRushRuntimeRect = {
  x: number
  y: number
  width: number
  height: number
}

export type QuizRushRuntimeLayout = {
  width: number
  height: number
  answerBounds: Array<QuizRushRuntimeRect | null>
  progressTarget: RuntimePoint | null
}

export type QuizRushVisualCommand =
  | { type: 'quiz/layout'; layout: QuizRushRuntimeLayout }
  | { type: 'quiz/hover'; optionIndex: number | null }
  | {
      type: 'quiz/feedback'
      correct: boolean
      optionIndex: number
      origin: RuntimePoint
      target: RuntimePoint
      streak: number
      sequence: number
    }
  | { type: 'quiz/reset' }

export type QuizRushVisualBridge = RuntimeBridge<QuizRushVisualCommand, never>

type Graphics = PhaserType.GameObjects.Graphics

type Reaction = {
  optionIndex: number
  kind: 'correct' | 'wrong'
  motion: {
    alpha: number
    pulse: number
    recoil: number
  }
}

const PARTICLE_TEXTURE = 'quiz-rush-energy-particle'

export function createQuizRushRuntime(
  visualBridge: QuizRushVisualBridge,
): PhaserRuntimeFactory {
  return ({ Phaser, parent, bridge }) => {
    class QuizRushEffectsScene extends Phaser.Scene {
      private ambient!: Graphics
      private platforms!: Graphics
      private tokenFx!: Graphics
      private particles!: PhaserType.GameObjects.Particles.ParticleEmitter
      private layout: QuizRushRuntimeLayout | null = null
      private hoverIndex: number | null = null
      private reaction: Reaction | null = null
      private tokenCurve: PhaserType.Curves.CubicBezier | null = null
      private token = { progress: 0, alpha: 0 }
      private lastTrailProgress = -1
      private reducedMotion = false
      private disposed = false
      private unsubscribeLifecycle: (() => boolean) | null = null
      private unsubscribeVisual: (() => boolean) | null = null

      constructor() {
        super('quiz-rush-effects')
      }

      create() {
        this.ambient = this.add.graphics().setDepth(0)
        this.platforms = this.add.graphics().setDepth(1)
        this.tokenFx = this.add.graphics().setDepth(3)
        this.createParticleTexture()
        this.particles = this.add.particles(0, 0, PARTICLE_TEXTURE, {
          emitting: false,
          reserve: 72,
          maxParticles: 112,
          lifespan: { min: 260, max: 520 },
          speed: { min: 12, max: 42 },
          angle: { min: 0, max: 360 },
          gravityY: 18,
          scale: { start: 0.62, end: 0 },
          alpha: { start: 0.82, end: 0 },
          tint: [0x138b8f, 0x64d8ce, 0xffffff],
          blendMode: Phaser.BlendModes.ADD,
        }).setDepth(4)

        this.unsubscribeLifecycle = bridge.subscribeCommands((command) => {
          if (this.disposed || command.type !== 'runtime/reduced-motion') return
          this.reducedMotion = command.enabled
          if (command.enabled) {
            this.tweens.killTweensOf(this.token)
            this.tokenCurve = null
            this.token.alpha = 0
            this.particles.killAll()
          }
        })

        this.unsubscribeVisual = visualBridge.subscribeCommands((command) => {
          if (this.disposed) return
          if (command.type === 'quiz/layout') {
            this.layout = command.layout
            return
          }

          if (command.type === 'quiz/hover') {
            this.hoverIndex = command.optionIndex
            return
          }

          if (command.type === 'quiz/feedback') {
            this.playFeedback(command)
            return
          }

          this.resetEffects()
        })

        const dispose = () => {
          if (this.disposed) return
          this.disposed = true
          this.unsubscribeLifecycle?.()
          this.unsubscribeVisual?.()
          this.unsubscribeLifecycle = null
          this.unsubscribeVisual = null
          this.particles.killAll()
        }
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose)
        this.events.once(Phaser.Scenes.Events.DESTROY, dispose)
      }

      update(time: number) {
        this.drawAmbient(time)
        this.drawPlatforms(time)
        this.drawEnergyToken()
      }

      private createParticleTexture() {
        if (this.textures.exists(PARTICLE_TEXTURE)) return
        const texture = this.add.graphics()
        texture.fillStyle(0xffffff, 1)
        texture.fillCircle(6, 6, 5)
        texture.generateTexture(PARTICLE_TEXTURE, 12, 12)
        texture.destroy()
      }

      private resetEffects() {
        this.hoverIndex = null
        this.reaction = null
        this.tokenCurve = null
        this.token.progress = 0
        this.token.alpha = 0
        this.lastTrailProgress = -1
        this.tweens.killAll()
        this.particles.killAll()
      }

      private playFeedback(command: Extract<QuizRushVisualCommand, { type: 'quiz/feedback' }>) {
        if (this.reaction) this.tweens.killTweensOf(this.reaction.motion)
        this.tweens.killTweensOf(this.token)
        this.particles.killAll()

        const reaction: Reaction = {
          optionIndex: command.optionIndex,
          kind: command.correct ? 'correct' : 'wrong',
          motion: { alpha: 1, pulse: 0, recoil: 0 },
        }
        this.reaction = reaction

        if (this.reducedMotion) {
          reaction.motion.alpha = 0.7
          reaction.motion.pulse = 1
          return
        }

        if (command.correct) {
          this.tweens.add({
            targets: reaction.motion,
            pulse: 1,
            alpha: 0.42,
            duration: 520,
            ease: 'Cubic.Out',
          })
          this.launchEnergyToken(command.origin, command.target, command.streak)
          return
        }

        this.particles
          .setParticleLifespan({ min: 220, max: 380 })
          .setParticleSpeed(42)
          .setEmitterAngle({ min: 0, max: 360 })
          .setParticleGravity(0, 48)
          .setParticleTint([0xe84d55, 0xff9b93])
        this.particles.explode(7, command.origin.x, command.origin.y)
        this.tweens.chain({
          targets: reaction.motion,
          tweens: [
            { recoil: -6, pulse: 0.55, duration: 62, ease: 'Sine.Out' },
            { recoil: 6, duration: 74, ease: 'Sine.InOut' },
            { recoil: -3, duration: 70, ease: 'Sine.InOut' },
            { recoil: 0, alpha: 0.4, pulse: 1, duration: 180, ease: 'Cubic.Out' },
          ],
        })
      }

      private launchEnergyToken(origin: RuntimePoint, target: RuntimePoint, streak: number) {
        const lift = Math.max(92, Math.abs(origin.y - target.y) * 0.3)
        this.tokenCurve = new Phaser.Curves.CubicBezier(
          new Phaser.Math.Vector2(origin.x, origin.y),
          new Phaser.Math.Vector2(origin.x + 42, origin.y - lift),
          new Phaser.Math.Vector2(target.x - 74, target.y + lift * 0.28),
          new Phaser.Math.Vector2(target.x, target.y),
        )
        this.token.progress = 0
        this.token.alpha = 1
        this.lastTrailProgress = -1

        this.particles
          .setParticleLifespan({ min: 260, max: 470 })
          .setParticleSpeed(18 + Math.min(12, streak * 2))
          .setEmitterAngle({ min: 0, max: 360 })
          .setParticleGravity(0, 12)
          .setParticleTint([0x138b8f, 0x64d8ce, 0xffffff])

        this.tweens.add({
          targets: this.token,
          progress: 1,
          duration: 720,
          ease: 'Cubic.InOut',
          onUpdate: () => {
            if (!this.tokenCurve || this.token.progress - this.lastTrailProgress < 0.035) return
            const point = this.tokenCurve.getPoint(this.token.progress)
            this.particles.emitParticleAt(point.x, point.y, 1 + Math.min(2, Math.floor(streak / 3)))
            this.lastTrailProgress = this.token.progress
          },
          onComplete: () => {
            this.particles
              .setParticleLifespan({ min: 340, max: 620 })
              .setParticleSpeed(82 + Math.min(22, streak * 3))
              .setEmitterAngle({ min: 0, max: 360 })
              .setParticleGravity(0, 70)
              .setParticleTint([0x15945b, 0x43c982, 0x64d8ce, 0xffffff])
            this.particles.explode(10 + Math.min(10, streak * 2), target.x, target.y)
            this.token.alpha = 0
            this.tokenCurve = null
          },
        })
      }

      private drawAmbient(time: number) {
        this.ambient.clear()
        const layout = this.layout
        if (!layout) return

        const horizon = layout.height * 0.54
        const drift = this.reducedMotion ? 0 : Math.sin(time * 0.00032) * 7

        this.ambient.lineStyle(2, 0x92d9d6, 0.1)
        this.ambient.beginPath()
        this.ambient.moveTo(-20, horizon - 85)
        this.ambient.lineTo(layout.width * 0.18, horizon - 45 + drift)
        this.ambient.lineTo(layout.width * 0.5, horizon - 24)
        this.ambient.lineTo(layout.width * 0.82, horizon - 45 - drift)
        this.ambient.lineTo(layout.width + 20, horizon - 85)
        this.ambient.strokePath()

        this.ambient.lineStyle(1, 0x4aa8a9, 0.055)
        for (let index = 0; index < 9; index += 1) {
          const x = (layout.width / 8) * index
          this.ambient.lineBetween(layout.width * 0.5, horizon, x, layout.height + 10)
        }
        for (let row = 0; row < 6; row += 1) {
          const y = horizon + Math.pow(row / 5, 1.62) * (layout.height - horizon)
          this.ambient.lineBetween(0, y, layout.width, y)
        }

        const moteCount = this.reducedMotion ? 5 : 13
        for (let index = 0; index < moteCount; index += 1) {
          const baseX = (((index * 173 + 47) % 997) / 997) * layout.width
          const baseY = (((index * 263 + 71) % 991) / 991) * layout.height
          const x = baseX + (this.reducedMotion ? 0 : Math.sin(time * 0.00045 + index) * 8)
          const y = baseY - (this.reducedMotion ? 0 : (time * (0.003 + index % 3 * 0.001)) % 38)
          const radius = 1.4 + index % 3
          this.ambient.fillStyle(index % 4 === 0 ? 0x15945b : 0x138b8f, 0.07)
          this.ambient.fillCircle(x, y, radius)
        }
      }

      private drawPlatforms(time: number) {
        this.platforms.clear()
        const layout = this.layout
        if (!layout) return

        layout.answerBounds.forEach((bounds, index) => {
          if (!bounds) return
          const hovered = this.hoverIndex === index
          const reaction = this.reaction?.optionIndex === index ? this.reaction : null
          const recoil = reaction?.motion.recoil ?? 0
          const pulse = reaction?.motion.pulse ?? 0
          const idle = this.reducedMotion ? 0 : Math.sin(time * 0.0017 + index * 0.8) * 1.4
          const x = bounds.x + recoil
          const y = bounds.y + idle * (hovered ? 1 : 0)
          const color = reaction?.kind === 'correct'
            ? 0x15945b
            : reaction?.kind === 'wrong'
              ? 0xe84d55
              : 0x138b8f
          const alpha = reaction ? reaction.motion.alpha : hovered ? 0.28 : 0.1

          this.platforms.fillStyle(0x1c5962, hovered ? 0.09 : 0.055)
          this.platforms.fillRoundedRect(x + 5, y + 10, bounds.width - 10, bounds.height, 24)
          this.platforms.lineStyle(hovered ? 3 : 1.5, color, alpha)
          this.platforms.strokeRoundedRect(x - 2, y - 2, bounds.width + 4, bounds.height + 4, 25)

          if (reaction) {
            const expansion = 5 + pulse * 16
            this.platforms.lineStyle(3.5 - pulse * 1.8, color, alpha * (1 - pulse * 0.48))
            this.platforms.strokeRoundedRect(
              x - expansion,
              y - expansion,
              bounds.width + expansion * 2,
              bounds.height + expansion * 2,
              27 + expansion * 0.4,
            )
          }
        })
      }

      private drawEnergyToken() {
        this.tokenFx.clear()
        const curve = this.tokenCurve
        if (!curve || this.token.alpha <= 0) return

        const end = Math.max(0.02, this.token.progress)
        const start = Math.max(0, end - 0.34)
        const segments = 18
        let previous = curve.getPoint(start)
        for (let index = 1; index <= segments; index += 1) {
          const position = start + (end - start) * (index / segments)
          const point = curve.getPoint(position)
          const alpha = (index / segments) * 0.35 * this.token.alpha
          this.tokenFx.lineStyle(2.5 + index / segments * 1.5, 0x38c8c0, alpha)
          this.tokenFx.lineBetween(previous.x, previous.y, point.x, point.y)
          previous = point
        }

        const point = curve.getPoint(end)
        const shimmer = 1 + Math.sin(this.time.now * 0.022) * 0.08
        this.tokenFx.fillStyle(0x38c8c0, 0.16 * this.token.alpha)
        this.tokenFx.fillCircle(point.x, point.y, 17 * shimmer)
        this.tokenFx.fillStyle(0x8cf4e8, 0.38 * this.token.alpha)
        this.tokenFx.fillCircle(point.x, point.y, 9 * shimmer)
        this.tokenFx.fillStyle(0xffffff, 0.96 * this.token.alpha)
        this.tokenFx.fillCircle(point.x, point.y, 3.4)
        this.tokenFx.lineStyle(1.4, 0xffffff, 0.72 * this.token.alpha)
        this.tokenFx.lineBetween(point.x - 10, point.y, point.x + 10, point.y)
        this.tokenFx.lineBetween(point.x, point.y - 10, point.x, point.y + 10)
      }
    }

    return new Phaser.Game({
      type: Phaser.WEBGL,
      parent,
      width: Math.max(1, parent.clientWidth),
      height: Math.max(1, parent.clientHeight),
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      scene: [QuizRushEffectsScene],
      audio: { noAudio: true },
      input: {
        keyboard: false,
        mouse: false,
        touch: false,
        gamepad: false,
      },
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
}
