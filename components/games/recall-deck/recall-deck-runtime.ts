import type PhaserType from 'phaser'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { PhaserRuntimeFactory, RuntimePoint } from '@/lib/game-runtime/contracts'
import type { RecallRating } from '@/lib/recall-deck'
import { resolveThemeManifest, type ThemeManifest } from '@/lib/theme-manifests'
import type { VisualThemeId } from '@/lib/visual-themes'

export type RecallRuntimeRect = RuntimePoint & {
  width: number
  height: number
}

export type RecallRuntimeLayout = {
  width: number
  height: number
  card: RecallRuntimeRect | null
  deck: RecallRuntimeRect | null
  reviewTray: RecallRuntimeRect | null
  rememberedTray: RecallRuntimeRect | null
}

export type RecallVisualCommand =
  | { type: 'recall/theme'; themeId: VisualThemeId }
  | { type: 'recall/layout'; layout: RecallRuntimeLayout }
  | {
      type: 'recall/state'
      cardKey: string
      revealed: boolean
      remaining: number
    }
  | { type: 'recall/reveal' }
  | { type: 'recall/drag'; offsetX: number | null; velocityX: number }
  | { type: 'recall/rate'; rating: RecallRating }
  | { type: 'recall/complete' }
  | { type: 'recall/reset' }

export type RecallVisualBridge = RuntimeBridge<RecallVisualCommand, never>

type Graphics = PhaserType.GameObjects.Graphics

type FlightFeedback = {
  rating: RecallRating
  startedAt: number
  start: RuntimePoint
  end: RuntimePoint
}

const PARTICLE_TEXTURE = 'recall-deck-mastery-particle'

export function createRecallDeckRuntime(
  visualBridge: RecallVisualBridge,
): PhaserRuntimeFactory {
  return ({ Phaser, parent, bridge }) => {
    class RecallDeckEffectsScene extends Phaser.Scene {
      private ambient!: Graphics
      private world!: Graphics
      private interactionFx!: Graphics
      private feedbackFx!: Graphics
      private particles!: PhaserType.GameObjects.Particles.ParticleEmitter
      private layout: RecallRuntimeLayout | null = null
      private manifest: ThemeManifest = resolveThemeManifest('corgi-classic')
      private cardKey = ''
      private remaining = 0
      private revealed = false
      private reducedMotion = false
      private revealStartedAt: number | null = null
      private completeStartedAt: number | null = null
      private flight: FlightFeedback | null = null
      private dragEcho = { x: 0, rotation: 0, alpha: 0 }
      private disposed = false
      private unsubscribeLifecycle: (() => boolean) | null = null
      private unsubscribeVisual: (() => boolean) | null = null

      constructor() {
        super('recall-deck-effects')
      }

      create() {
        this.ambient = this.add.graphics().setDepth(0)
        this.world = this.add.graphics().setDepth(1)
        this.interactionFx = this.add.graphics().setDepth(3)
        this.feedbackFx = this.add.graphics().setDepth(4)
        this.createParticleTexture()
        this.particles = this.add.particles(0, 0, PARTICLE_TEXTURE, {
          emitting: false,
          reserve: 42,
          maxParticles: 76,
          lifespan: { min: 360, max: 650 },
          speed: { min: 68, max: 136 },
          angle: { min: 195, max: 345 },
          gravityY: 105,
          scale: { start: 0.86, end: 0 },
          alpha: { start: 0.92, end: 0 },
          tint: [
            hexToNumber(this.manifest.palette.success),
            hexToNumber(this.manifest.palette.accent),
            0xffffff,
          ],
          blendMode: Phaser.BlendModes.ADD,
        }).setDepth(5)

        this.unsubscribeLifecycle = bridge.subscribeCommands((command) => {
          if (this.disposed || command.type !== 'runtime/reduced-motion') return
          this.reducedMotion = command.enabled
          if (command.enabled) {
            this.tweens.killAll()
            this.particles.killAll()
            this.dragEcho.x = 0
            this.dragEcho.rotation = 0
            this.dragEcho.alpha = 0
          }
        })

        this.unsubscribeVisual = visualBridge.subscribeCommands((command) => {
          if (this.disposed) return
          if (command.type === 'recall/theme') {
            this.manifest = resolveThemeManifest(command.themeId)
            this.configureParticleColors('remembered')
            return
          }

          if (command.type === 'recall/layout') {
            this.layout = command.layout
            return
          }

          if (command.type === 'recall/state') {
            if (this.cardKey !== command.cardKey) {
              this.cardKey = command.cardKey
              this.revealStartedAt = null
              this.flight = null
              this.dragEcho.x = 0
              this.dragEcho.rotation = 0
              this.dragEcho.alpha = 0
            }
            this.revealed = command.revealed
            this.remaining = command.remaining
            return
          }

          if (command.type === 'recall/reveal') {
            this.revealed = true
            this.revealStartedAt = this.time.now
            return
          }

          if (command.type === 'recall/drag') {
            if (command.offsetX === null) {
              this.settleDrag(command.velocityX)
              return
            }
            this.tweens.killTweensOf(this.dragEcho)
            this.dragEcho.x = command.offsetX
            this.dragEcho.rotation = clamp(command.offsetX / 22, -8, 8)
            this.dragEcho.alpha = Math.min(0.58, Math.abs(command.offsetX) / 260)
            return
          }

          if (command.type === 'recall/rate') {
            this.startRatingFlight(command.rating)
            return
          }

          if (command.type === 'recall/complete') {
            this.completeStartedAt = this.time.now
            const layout = this.layout
            if (!this.reducedMotion && layout) {
              this.configureParticleColors('remembered')
              this.particles.setParticleSpeed(136)
              this.particles.explode(20, layout.width * 0.5, layout.height * 0.5)
            }
            return
          }

          this.resetVisualState()
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
        this.drawWorld(time)
        this.drawInteraction()
        this.drawFeedback(time)
      }

      private createParticleTexture() {
        if (this.textures.exists(PARTICLE_TEXTURE)) return
        const texture = this.add.graphics()
        texture.fillStyle(0xffffff, 1)
        texture.fillCircle(6, 6, 4.8)
        texture.generateTexture(PARTICLE_TEXTURE, 12, 12)
        texture.destroy()
      }

      private configureParticleColors(rating: RecallRating) {
        this.particles.setParticleTint(
          rating === 'remembered'
            ? [
                hexToNumber(this.manifest.palette.success),
                hexToNumber(this.manifest.palette.accent),
                0xffffff,
              ]
            : [
                hexToNumber(this.manifest.palette.danger),
                hexToNumber(this.manifest.palette.accentAlt),
                0xffffff,
              ],
        )
      }

      private settleDrag(velocityX: number) {
        this.tweens.killTweensOf(this.dragEcho)
        if (this.reducedMotion) {
          this.dragEcho.x = 0
          this.dragEcho.rotation = 0
          this.dragEcho.alpha = 0
          return
        }
        this.tweens.add({
          targets: this.dragEcho,
          x: 0,
          rotation: 0,
          alpha: 0,
          duration: Math.max(190, 280 - Math.min(70, Math.abs(velocityX) * 0.01)),
          ease: 'Back.Out',
        })
      }

      private startRatingFlight(rating: RecallRating) {
        const layout = this.layout
        const card = layout?.card
        const tray = rating === 'remembered' ? layout?.rememberedTray : layout?.reviewTray
        if (!layout || !card || !tray) return

        this.flight = {
          rating,
          startedAt: this.time.now,
          start: rectCenter(card),
          end: rectCenter(tray),
        }

        if (!this.reducedMotion) {
          this.time.delayedCall(270, () => {
            if (this.disposed) return
            const currentLayout = this.layout
            const currentTray = rating === 'remembered'
              ? currentLayout?.rememberedTray
              : currentLayout?.reviewTray
            if (!currentTray) return
            this.configureParticleColors(rating)
            this.particles.setParticleSpeed(rating === 'remembered' ? 112 : 72)
            const center = rectCenter(currentTray)
            this.particles.explode(rating === 'remembered' ? 12 : 6, center.x, center.y)
          })
        }
      }

      private resetVisualState() {
        this.revealStartedAt = null
        this.completeStartedAt = null
        this.flight = null
        this.dragEcho.x = 0
        this.dragEcho.rotation = 0
        this.dragEcho.alpha = 0
        this.particles.killAll()
        this.tweens.killAll()
      }

      private drawAmbient(time: number) {
        this.ambient.clear()
        const layout = this.layout
        if (!layout) return
        const accent = hexToNumber(this.manifest.palette.accent)
        const alternate = hexToNumber(this.manifest.palette.accentAlt)
        const deepSea = this.manifest.id === 'deep-sea'

        if (!deepSea) {
          const horizon = layout.height * 0.54
          this.ambient.lineStyle(1, accent, 0.045)
          for (let index = 0; index < 9; index += 1) {
            const x = (layout.width / 8) * index
            this.ambient.lineBetween(layout.width * 0.5, horizon, x, layout.height)
          }
          for (let row = 0; row < 5; row += 1) {
            const y = horizon + Math.pow(row / 4, 1.55) * (layout.height - horizon)
            this.ambient.lineBetween(0, y, layout.width, y)
          }
        }

        const count = this.reducedMotion ? 6 : 15
        for (let index = 0; index < count; index += 1) {
          const phase = time * (deepSea ? 0.00045 : 0.0002) + index * 0.71
          const drift = this.reducedMotion ? 0 : Math.sin(phase) * (5 + index % 4)
          const x = (((index * 181 + 47) % 997) / 997) * layout.width + drift
          const y = (((index * 263 + 71) % 991) / 991) * layout.height
          const radius = deepSea ? 2 + index % 4 : 1.3 + index % 3
          this.ambient.fillStyle(index % 4 === 0 ? alternate : accent, deepSea ? 0.15 : 0.065)
          this.ambient.fillCircle(x, y, radius)
          if (deepSea && index % 2 === 0) {
            this.ambient.lineStyle(1, accent, 0.15)
            this.ambient.strokeCircle(x, y, radius + 2.5)
          }
        }
      }

      private drawWorld(time: number) {
        this.world.clear()
        const layout = this.layout
        if (!layout) return

        if (layout.deck) this.drawDeck(layout.deck, time)
        if (layout.reviewTray) {
          this.drawTray(
            layout.reviewTray,
            hexToNumber(this.manifest.palette.danger),
            this.dragEcho.x < -34,
          )
        }
        if (layout.rememberedTray) {
          this.drawTray(
            layout.rememberedTray,
            hexToNumber(this.manifest.palette.success),
            this.dragEcho.x > 34,
          )
        }
      }

      private drawDeck(bounds: RecallRuntimeRect, time: number) {
        const deepSea = this.manifest.id === 'deep-sea'
        const accent = hexToNumber(this.manifest.palette.accent)
        const layers = Math.max(2, Math.min(5, this.remaining))
        const breath = this.reducedMotion ? 0 : Math.sin(time * 0.00155) * 1.2

        for (let index = layers; index >= 1; index -= 1) {
          const progress = index / Math.max(1, layers)
          const inset = index * 5.5
          const lift = index * 8 + breath * progress
          this.world.fillStyle(0x173d48, deepSea ? 0.16 : 0.075)
          this.world.fillRoundedRect(
            bounds.x + inset + 3,
            bounds.y - lift + 7,
            bounds.width - inset * 2,
            bounds.height,
            24,
          )
          this.world.fillStyle(deepSea ? 0x164757 : 0xf6fbfa, deepSea ? 0.9 : 0.98 - progress * 0.08)
          this.world.fillRoundedRect(
            bounds.x + inset,
            bounds.y - lift,
            bounds.width - inset * 2,
            bounds.height,
            24,
          )
          this.world.lineStyle(1.2, accent, deepSea ? 0.22 : 0.1 + progress * 0.035)
          this.world.strokeRoundedRect(
            bounds.x + inset,
            bounds.y - lift,
            bounds.width - inset * 2,
            bounds.height,
            24,
          )
        }
      }

      private drawTray(bounds: RecallRuntimeRect, color: number, active: boolean) {
        const deepSea = this.manifest.id === 'deep-sea'
        const lift = active ? -5 : 0
        const scale = active ? 1.025 : 1
        const width = bounds.width * scale
        const x = bounds.x - (width - bounds.width) * 0.5
        const y = bounds.y + lift
        const height = bounds.height

        this.world.fillStyle(0x173b45, deepSea ? 0.2 : 0.105)
        this.world.fillRoundedRect(x + 4, y + 10, width - 8, height - 2, 22)
        this.world.fillStyle(color, deepSea ? 0.48 : 0.24)
        this.world.fillRoundedRect(x, y, width, height - 8, 22)
        this.world.fillStyle(deepSea ? 0x174756 : 0xfffcfa, deepSea ? 0.86 : 0.93)
        this.world.fillRoundedRect(x + 9, y + 9, width - 18, height - 41, 16)
        this.world.lineStyle(active ? 3.5 : 2, color, active ? 0.74 : 0.35)
        this.world.strokeRoundedRect(x + 9, y + 9, width - 18, height - 41, 16)
        this.world.fillStyle(color, active ? 0.2 : 0.1)
        this.world.fillEllipse(x + width * 0.5, y + height * 0.42, width * 0.64, height * 0.34)
      }

      private drawInteraction() {
        this.interactionFx.clear()
        const card = this.layout?.card
        if (!card || this.dragEcho.alpha <= 0) return

        const center = rectCenter(card)
        const color = this.dragEcho.x >= 0
          ? hexToNumber(this.manifest.palette.success)
          : hexToNumber(this.manifest.palette.danger)
        const x = card.x + this.dragEcho.x
        const y = card.y - Math.abs(this.dragEcho.x) * 0.025
        this.interactionFx.fillStyle(color, this.dragEcho.alpha * 0.12)
        this.interactionFx.fillRoundedRect(x - 5, y + 10, card.width + 10, card.height, 26)
        this.interactionFx.lineStyle(3, color, this.dragEcho.alpha * 0.66)
        this.interactionFx.strokeRoundedRect(x, y, card.width, card.height, 24)
        this.interactionFx.fillStyle(color, this.dragEcho.alpha * 0.24)
        this.interactionFx.fillCircle(center.x + this.dragEcho.x, center.y, 10)
      }

      private drawFeedback(time: number) {
        this.feedbackFx.clear()
        const layout = this.layout
        if (!layout) return

        if (this.revealStartedAt !== null && !this.reducedMotion) {
          const elapsed = time - this.revealStartedAt
          const progress = Math.min(1, elapsed / 620)
          const card = layout.card
          if (card && progress < 1) {
            const accent = hexToNumber(this.manifest.palette.accent)
            const sweepX = card.x + card.width * easeInOutCubic(progress)
            const alpha = Math.sin(progress * Math.PI)
            this.feedbackFx.fillStyle(accent, alpha * 0.12)
            this.feedbackFx.fillRoundedRect(sweepX - 22, card.y - 5, 44, card.height + 10, 18)
            this.feedbackFx.lineStyle(2.5, accent, alpha * 0.46)
            this.feedbackFx.strokeRoundedRect(card.x - 3, card.y - 3, card.width + 6, card.height + 6, 27)
          }
          if (progress >= 1) this.revealStartedAt = null
        }

        if (this.flight) {
          const duration = 420
          const progress = Math.min(1, (time - this.flight.startedAt) / duration)
          if (!this.reducedMotion && progress < 1) {
            const color = hexToNumber(
              this.flight.rating === 'remembered'
                ? this.manifest.palette.success
                : this.manifest.palette.danger,
            )
            const curve = flightCurve(Phaser, this.flight.start, this.flight.end)
            strokeCurve(this.feedbackFx, curve, color, 8, (1 - progress) * 0.2)
            const point = curve.getPoint(easeOutCubic(progress))
            this.feedbackFx.fillStyle(color, 0.24 * (1 - progress))
            this.feedbackFx.fillCircle(point.x, point.y, 13)
            this.feedbackFx.fillStyle(0xffffff, 0.92 * (1 - progress))
            this.feedbackFx.fillCircle(point.x, point.y, 3.4)
          }
          if (progress >= 1) this.flight = null
        }

        if (this.completeStartedAt !== null && !this.reducedMotion) {
          const elapsed = time - this.completeStartedAt
          if (elapsed < 1250) {
            const progress = Math.min(1, elapsed / 720)
            const alpha = 1 - elapsed / 1250
            this.feedbackFx.lineStyle(3, hexToNumber(this.manifest.palette.success), alpha * 0.4)
            this.feedbackFx.strokeCircle(
              layout.width * 0.5,
              layout.height * 0.48,
              28 + easeOutCubic(progress) * 92,
            )
          }
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
      scene: [RecallDeckEffectsScene],
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

function rectCenter(rect: RecallRuntimeRect): RuntimePoint {
  return {
    x: rect.x + rect.width * 0.5,
    y: rect.y + rect.height * 0.5,
  }
}

function flightCurve(
  Phaser: typeof PhaserType,
  start: RuntimePoint,
  end: RuntimePoint,
) {
  const direction = end.x < start.x ? -1 : 1
  return new Phaser.Curves.CubicBezier(
    new Phaser.Math.Vector2(start.x, start.y),
    new Phaser.Math.Vector2(start.x + direction * 42, start.y - 72),
    new Phaser.Math.Vector2(end.x - direction * 54, end.y - 34),
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function easeOutCubic(value: number) {
  const t = clamp(value, 0, 1)
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(value: number) {
  const t = clamp(value, 0, 1)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function hexToNumber(color: string, fallback = 0x0ca6a3) {
  const match = color.match(/^#([\da-f]{6})$/i)
  return match ? Number.parseInt(match[1], 16) : fallback
}
