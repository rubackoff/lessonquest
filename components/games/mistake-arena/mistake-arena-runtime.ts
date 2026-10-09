import type PhaserType from 'phaser'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { PhaserRuntimeFactory } from '@/lib/game-runtime/contracts'
import { resolveThemeManifest, type ThemeManifest } from '@/lib/theme-manifests'
import type { VisualThemeId } from '@/lib/visual-themes'

export type MistakeArenaRuntimeRect = {
  x: number
  y: number
  width: number
  height: number
}

export type MistakeArenaRuntimeLayout = {
  width: number
  height: number
  board: MistakeArenaRuntimeRect | null
  tokens: Array<MistakeArenaRuntimeRect | null>
}

export type MistakeArenaVisualCommand =
  | { type: 'mistake/theme'; themeId: VisualThemeId }
  | { type: 'mistake/layout'; layout: MistakeArenaRuntimeLayout }
  | { type: 'mistake/focus'; index: number | null }
  | { type: 'mistake/feedback'; index: number; correct: boolean }
  | { type: 'mistake/reset' }

export type MistakeArenaVisualBridge = RuntimeBridge<MistakeArenaVisualCommand, never>

type Feedback = {
  index: number
  correct: boolean
  startedAt: number
}

type Graphics = PhaserType.GameObjects.Graphics

const PARTICLE_TEXTURE = 'mistake-arena-particle'

export function createMistakeArenaRuntime(
  visualBridge: MistakeArenaVisualBridge,
): PhaserRuntimeFactory {
  return ({ Phaser, parent, bridge }) => {
    class MistakeArenaEffectsScene extends Phaser.Scene {
      private ambient!: Graphics
      private scan!: Graphics
      private feedbackLayer!: Graphics
      private particles!: PhaserType.GameObjects.Particles.ParticleEmitter
      private layout: MistakeArenaRuntimeLayout | null = null
      private focusedIndex: number | null = null
      private feedback: Feedback | null = null
      private manifest: ThemeManifest = resolveThemeManifest('corgi-classic')
      private reducedMotion = false
      private disposed = false
      private unsubscribeLifecycle: (() => boolean) | null = null
      private unsubscribeVisual: (() => boolean) | null = null

      constructor() {
        super('mistake-arena-effects')
      }

      create() {
        this.ambient = this.add.graphics().setDepth(0)
        this.scan = this.add.graphics().setDepth(2)
        this.feedbackLayer = this.add.graphics().setDepth(4)
        this.createParticleTexture()
        this.particles = this.add.particles(0, 0, PARTICLE_TEXTURE, {
          emitting: false,
          reserve: 36,
          maxParticles: 56,
          lifespan: { min: 380, max: 660 },
          speed: { min: 55, max: 128 },
          angle: { min: 195, max: 345 },
          gravityY: 92,
          scale: { start: 0.88, end: 0 },
          alpha: { start: 0.92, end: 0 },
          tint: [hexToNumber(this.manifest.palette.success), 0xffffff],
          blendMode: Phaser.BlendModes.ADD,
        }).setDepth(5)

        this.unsubscribeLifecycle = bridge.subscribeCommands((command) => {
          if (this.disposed || command.type !== 'runtime/reduced-motion') return
          this.reducedMotion = command.enabled
          if (command.enabled) this.particles.killAll()
        })

        this.unsubscribeVisual = visualBridge.subscribeCommands((command) => {
          if (this.disposed) return
          if (command.type === 'mistake/theme') {
            this.manifest = resolveThemeManifest(command.themeId)
            this.particles.setParticleTint([
              hexToNumber(this.manifest.palette.success),
              0xffffff,
            ])
            return
          }
          if (command.type === 'mistake/layout') {
            this.layout = command.layout
            return
          }
          if (command.type === 'mistake/focus') {
            this.focusedIndex = command.index
            return
          }
          if (command.type === 'mistake/feedback') {
            this.feedback = { ...command, startedAt: this.time.now }
            const token = this.layout?.tokens[command.index]
            if (command.correct && token && !this.reducedMotion) {
              this.particles
                .setEmitterAngle({ min: 195, max: 345 })
                .setParticleSpeed(112)
                .setParticleGravity(0, 92)
                .setParticleLifespan({ min: 400, max: 680 })
                .setParticleTint([
                  hexToNumber(this.manifest.palette.success),
                  hexToNumber(this.manifest.palette.accent),
                  0xffffff,
                ])
              this.particles.explode(
                14,
                token.x + token.width * 0.5,
                token.y + token.height * 0.5,
              )
            }
            return
          }

          this.focusedIndex = null
          this.feedback = null
          this.particles.killAll()
        })

        const dispose = () => {
          if (this.disposed) return
          this.disposed = true
          this.unsubscribeLifecycle?.()
          this.unsubscribeVisual?.()
          this.unsubscribeLifecycle = null
          this.unsubscribeVisual = null
        }
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose)
        this.events.once(Phaser.Scenes.Events.DESTROY, dispose)
      }

      update(time: number) {
        this.drawAmbient(time)
        this.drawScanner(time)
        this.drawFeedback(time)
      }

      private createParticleTexture() {
        if (this.textures.exists(PARTICLE_TEXTURE)) return
        const texture = this.add.graphics()
        texture.fillStyle(0xffffff, 1)
        texture.fillCircle(5, 5, 4)
        texture.generateTexture(PARTICLE_TEXTURE, 10, 10)
        texture.destroy()
      }

      private drawAmbient(time: number) {
        this.ambient.clear()
        const layout = this.layout
        if (!layout) return
        const accent = hexToNumber(this.manifest.palette.accent)
        const board = layout.board

        if (board) {
          this.ambient.lineStyle(1, accent, 0.07)
          for (let index = 1; index < 5; index += 1) {
            const y = board.y + (board.height * index) / 5
            this.ambient.lineBetween(board.x + 26, y, board.x + board.width - 26, y)
          }
          const orbitX = board.x + board.width * 0.86
          const orbitY = board.y + board.height * 0.2
          const pulse = this.reducedMotion ? 0 : Math.sin(time * 0.0014) * 5
          this.ambient.lineStyle(1.25, accent, 0.11)
          this.ambient.strokeCircle(orbitX, orbitY, 48 + pulse)
          this.ambient.strokeCircle(orbitX, orbitY, 72 - pulse * 0.45)
          this.ambient.lineStyle(1, accent, 0.08)
          this.ambient.lineBetween(orbitX - 92, orbitY, orbitX + 92, orbitY)
          this.ambient.lineBetween(orbitX, orbitY - 92, orbitX, orbitY + 92)
        }
      }

      private drawScanner(time: number) {
        this.scan.clear()
        const layout = this.layout
        const board = layout?.board
        if (!layout || !board) return
        const accent = hexToNumber(this.manifest.palette.accent)
        const duration = 4100
        const progress = this.reducedMotion ? 0.5 : (time % duration) / duration
        const scanX = board.x + 18 + progress * (board.width - 36)
        const fadeWidth = Math.min(110, board.width * 0.12)

        this.scan.fillStyle(accent, 0.018)
        this.scan.fillRect(scanX - fadeWidth, board.y + 15, fadeWidth, board.height - 30)
        this.scan.lineStyle(1.4, accent, 0.23)
        this.scan.lineBetween(scanX, board.y + 18, scanX, board.y + board.height - 18)
        this.scan.fillStyle(0xffffff, 0.72)
        this.scan.fillCircle(scanX, board.y + 20, 2.2)

        const token = this.focusedIndex === null ? null : layout.tokens[this.focusedIndex]
        if (!token) return
        const cx = token.x + token.width * 0.5
        const cy = token.y + token.height * 0.5
        const pulse = this.reducedMotion ? 0 : (Math.sin(time * 0.006) + 1) * 2.5
        this.scan.fillStyle(accent, 0.055)
        this.scan.fillRoundedRect(token.x - 8, token.y - 8, token.width + 16, token.height + 16, 16)
        this.scan.lineStyle(2, accent, 0.5)
        this.scan.strokeRoundedRect(token.x - 5 - pulse, token.y - 5 - pulse, token.width + 10 + pulse * 2, token.height + 10 + pulse * 2, 14)
        this.scan.fillStyle(0xffffff, 0.9)
        this.scan.fillCircle(cx, cy - token.height * 0.7, 2.4)
      }

      private drawFeedback(time: number) {
        this.feedbackLayer.clear()
        const feedback = this.feedback
        const token = feedback ? this.layout?.tokens[feedback.index] : null
        if (!feedback || !token) return

        const elapsed = time - feedback.startedAt
        const duration = feedback.correct ? 900 : 620
        const progress = Math.min(1, elapsed / duration)
        const color = hexToNumber(
          feedback.correct
            ? this.manifest.palette.success
            : this.manifest.palette.danger,
        )
        const cx = token.x + token.width * 0.5
        const cy = token.y + token.height * 0.5
        const radius = Math.max(token.width, token.height) * 0.72 + easeOutCubic(progress) * 46
        const alpha = 1 - progress

        this.feedbackLayer.lineStyle(feedback.correct ? 3 : 4, color, 0.62 * alpha)
        this.feedbackLayer.strokeCircle(cx, cy, radius)
        this.feedbackLayer.lineStyle(1.5, 0xffffff, 0.52 * alpha)
        this.feedbackLayer.strokeCircle(cx, cy, Math.max(12, radius - 8))

        if (!feedback.correct && !this.reducedMotion && progress < 0.72) {
          const direction = Math.sin(progress * Math.PI * 8) * (1 - progress) * 7
          this.feedbackLayer.lineStyle(2, color, 0.42 * alpha)
          this.feedbackLayer.lineBetween(cx - 18 + direction, cy + 26, cx + 18 + direction, cy + 26)
        }

        if (progress >= 1) this.feedback = null
      }
    }

    return new Phaser.Game({
      type: Phaser.WEBGL,
      parent,
      width: Math.max(1, parent.clientWidth),
      height: Math.max(1, parent.clientHeight),
      transparent: true,
      backgroundColor: 'rgba(0,0,0,0)',
      scene: [MistakeArenaEffectsScene],
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

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3)
}

function hexToNumber(color: string, fallback = 0x0ca6a3) {
  const match = color.match(/^#([\da-f]{6})$/i)
  return match ? Number.parseInt(match[1], 16) : fallback
}
