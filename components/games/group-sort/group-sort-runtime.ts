import type PhaserType from 'phaser'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { PhaserRuntimeFactory, RuntimePoint } from '@/lib/game-runtime/contracts'
import { resolveThemeManifest, type ThemeManifest } from '@/lib/theme-manifests'
import type { VisualThemeId } from '@/lib/visual-themes'

export type GroupSortRuntimeRect = RuntimePoint & {
  width: number
  height: number
}

export type GroupSortRuntimeLayout = {
  width: number
  height: number
  stations: Array<{
    id: string
    index: number
    bounds: GroupSortRuntimeRect
    placedCount: number
  }>
  cards: Array<{
    id: string
    bounds: GroupSortRuntimeRect
    placed: boolean
  }>
  conveyor: GroupSortRuntimeRect | null
  mascot: GroupSortRuntimeRect | null
}

export type GroupSortRuntimeInteraction = {
  itemId: string | null
  origin: RuntimePoint | null
  point: RuntimePoint | null
  visualCenter: RuntimePoint | null
  activeGroupId: string | null
  dragging: boolean
}

export type GroupSortVisualCommand =
  | { type: 'group/theme'; themeId: VisualThemeId }
  | { type: 'group/layout'; layout: GroupSortRuntimeLayout }
  | { type: 'group/interaction'; interaction: GroupSortRuntimeInteraction }
  | {
      type: 'group/feedback'
      kind: 'correct' | 'wrong'
      groupId: string
      from: RuntimePoint
      origin: RuntimePoint
    }
  | { type: 'group/complete' }
  | { type: 'group/reset' }

export class GroupSortVisualBridge extends RuntimeBridge<GroupSortVisualCommand, never> {
  private latestTheme: Extract<GroupSortVisualCommand, { type: 'group/theme' }> | null = null
  private latestLayout: Extract<GroupSortVisualCommand, { type: 'group/layout' }> | null = null

  override sendCommand(command: GroupSortVisualCommand) {
    if (command.type === 'group/theme') this.latestTheme = command
    if (command.type === 'group/layout') this.latestLayout = command
    super.sendCommand(command)
  }

  override subscribeCommands(listener: (command: GroupSortVisualCommand) => void) {
    const unsubscribe = super.subscribeCommands(listener)
    if (this.latestTheme) listener(this.latestTheme)
    if (this.latestLayout) listener(this.latestLayout)
    return unsubscribe
  }
}

type Graphics = PhaserType.GameObjects.Graphics

type StationMotion = {
  intro: number
  hover: {
    lift: number
    scale: number
  }
  feedback: {
    alpha: number
    recoil: number
    scale: number
    kind: 'correct' | 'wrong' | null
  }
}

type StationVisual = {
  shell: PhaserType.GameObjects.Image
  motif: PhaserType.GameObjects.Image
  shellScale: number
  motifScale: number
}

type RuntimeFeedback = {
  kind: 'correct' | 'wrong'
  groupId: string
  from: RuntimePoint
  origin: RuntimePoint
  startedAt: number
}

const ART_KEY = 'group-sort-art'
const BACKGROUND_KEY = 'group-sort-background'
const ASSET_ROOT = '/game-assets/games/group-sort'
const STATION_FRAMES = ['station-green', 'station-blue', 'station-gold'] as const
const MOTIF_FRAMES = ['motif-graph', 'motif-atom', 'motif-feather'] as const

export function createGroupSortRuntime(
  visualBridge: GroupSortVisualBridge,
): PhaserRuntimeFactory {
  return ({ Phaser, parent, bridge }) => {
    class GroupSortEffectsScene extends Phaser.Scene {
      private background!: PhaserType.GameObjects.Image
      private conveyor: PhaserType.GameObjects.NineSlice | null = null
      private mascotPedestal: PhaserType.GameObjects.Image | null = null
      private stationVisuals = new Map<string, StationVisual>()
      private cardVisuals = new Map<string, PhaserType.GameObjects.NineSlice>()
      private trail!: Graphics
      private feedbackFx!: Graphics
      private particles!: PhaserType.GameObjects.Particles.ParticleEmitter
      private layout: GroupSortRuntimeLayout | null = null
      private interaction: GroupSortRuntimeInteraction = emptyInteraction()
      private feedback: RuntimeFeedback | null = null
      private stationMotion = new Map<string, StationMotion>()
      private manifest: ThemeManifest = resolveThemeManifest('corgi-classic')
      private reducedMotion = false
      private completeStartedAt: number | null = null
      private disposed = false
      private unsubscribeLifecycle: (() => boolean) | null = null
      private unsubscribeVisual: (() => boolean) | null = null

      constructor() {
        super('group-sort-effects')
      }

      preload() {
        this.load.image(BACKGROUND_KEY, `${ASSET_ROOT}/background.png`)
        this.load.atlas(ART_KEY, `${ASSET_ROOT}/atlas.png`, `${ASSET_ROOT}/atlas.json`)
      }

      create() {
        this.background = this.add.image(0, 0, BACKGROUND_KEY).setOrigin(0.5).setDepth(0)
        this.trail = this.add.graphics().setDepth(18)
        this.feedbackFx = this.add.graphics().setDepth(19)
        this.particles = this.add.particles(0, 0, ART_KEY, {
          frame: 'particle-spark',
          emitting: false,
          reserve: 56,
          maxParticles: 96,
          lifespan: { min: 380, max: 680 },
          speed: { min: 76, max: 148 },
          angle: { min: 198, max: 342 },
          gravityY: 118,
          scale: { start: 0.72, end: 0 },
          alpha: { start: 0.96, end: 0 },
          tint: particleTints(this.manifest),
          blendMode: Phaser.BlendModes.ADD,
        }).setDepth(20)

        this.unsubscribeLifecycle = bridge.subscribeCommands((command) => {
          if (this.disposed) return
          if (command.type !== 'runtime/reduced-motion') return
          this.reducedMotion = command.enabled
          if (command.enabled) {
            this.particles.killAll()
            this.tweens.killAll()
            this.cameras.main.resetFX()
            this.snapStationMotion()
          }
        })

        this.unsubscribeVisual = visualBridge.subscribeCommands((command) => {
          if (this.disposed) return

          if (command.type === 'group/theme') {
            this.manifest = resolveThemeManifest(command.themeId)
            this.particles.setParticleTint(particleTints(this.manifest))
            return
          }

          if (command.type === 'group/layout') {
            this.layout = command.layout
            this.ensureStationMotion()
            this.syncLayout()
            return
          }

          if (command.type === 'group/interaction') {
            const previousTarget = this.interaction.activeGroupId
            this.interaction = command.interaction
            if (previousTarget !== command.interaction.activeGroupId) {
              this.animateActiveStation(command.interaction.activeGroupId)
            }
            return
          }

          if (command.type === 'group/feedback') {
            this.feedback = { ...command, startedAt: this.time.now }
            this.animateFeedback(command.kind, command.groupId)
            return
          }

          if (command.type === 'group/complete') {
            this.completeStartedAt = this.time.now
            if (!this.reducedMotion && this.layout) {
              this.particles
                .setEmitterAngle({ min: 195, max: 345 })
                .setParticleSpeed(142)
                .setParticleGravity(0, 112)
                .setParticleLifespan({ min: 680, max: 1100 })
                .setParticleTint(particleTints(this.manifest))
              this.particles.explode(24, this.layout.width * 0.5, this.layout.height * 0.48)
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
          this.stationMotion.clear()
          this.stationVisuals.clear()
          this.cardVisuals.clear()
        }

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose)
        this.events.once(Phaser.Scenes.Events.DESTROY, dispose)
      }

      update(time: number) {
        this.syncDynamicVisuals(time)
        this.drawTrail(time)
        this.drawFeedback(time)
      }

      private ensureStationMotion() {
        const ids = new Set(this.layout?.stations.map((station) => station.id) ?? [])
        for (const id of this.stationMotion.keys()) {
          if (!ids.has(id)) this.stationMotion.delete(id)
        }
        for (const station of this.layout?.stations ?? []) {
          if (this.stationMotion.has(station.id)) continue
          const motion: StationMotion = {
            intro: this.reducedMotion ? 1 : 0,
            hover: { lift: 0, scale: 1 },
            feedback: { alpha: 0, recoil: 0, scale: 1, kind: null },
          }
          this.stationMotion.set(station.id, motion)
          if (!this.reducedMotion) {
            this.tweens.add({
              targets: motion,
              intro: 1,
              delay: station.index * 55,
              duration: 460,
              ease: 'Back.Out',
            })
          }
        }
      }

      private syncLayout() {
        const layout = this.layout
        if (!layout) return

        const backgroundScale = Math.max(
          layout.width / Math.max(1, this.background.width),
          layout.height / Math.max(1, this.background.height),
        )
        this.background
          .setPosition(layout.width * 0.5, layout.height * 0.5)
          .setScale(backgroundScale)
          .setAlpha(1)

        const stationIds = new Set(layout.stations.map((station) => station.id))
        for (const [id, visual] of this.stationVisuals) {
          if (stationIds.has(id)) continue
          visual.shell.destroy()
          visual.motif.destroy()
          this.stationVisuals.delete(id)
        }

        for (const station of layout.stations) {
          const stationFrame = STATION_FRAMES[station.index % STATION_FRAMES.length]
          const motifFrame = MOTIF_FRAMES[station.index % MOTIF_FRAMES.length]
          let visual = this.stationVisuals.get(station.id)
          if (!visual) {
            visual = {
              shell: this.add.image(0, 0, ART_KEY, stationFrame).setOrigin(0.5).setDepth(2),
              motif: this.add.image(0, 0, ART_KEY, motifFrame).setOrigin(0.5).setDepth(3),
              shellScale: 1,
              motifScale: 1,
            }
            this.stationVisuals.set(station.id, visual)
          } else {
            visual.shell.setTexture(ART_KEY, stationFrame)
            visual.motif.setTexture(ART_KEY, motifFrame)
          }

          visual.shellScale = Math.min(
            (station.bounds.width * 1.08) / Math.max(1, visual.shell.width),
            (station.bounds.height * 1.01) / Math.max(1, visual.shell.height),
          )
          const motifSize = Math.min(152, station.bounds.width * 0.45)
          visual.motifScale = motifSize / Math.max(1, Math.max(visual.motif.width, visual.motif.height))
        }

        if (layout.conveyor) {
          if (!this.conveyor) {
            this.conveyor = this.add.nineslice(
              0,
              0,
              ART_KEY,
              'tray',
              layout.conveyor.width,
              layout.conveyor.height,
              40,
              40,
              32,
              48,
            ).setOrigin(0.5).setDepth(4)
          }
          this.conveyor
            .setVisible(true)
            .setPosition(
              layout.conveyor.x + layout.conveyor.width * 0.5,
              layout.conveyor.y + layout.conveyor.height * 0.5,
            )
            .setSize(layout.conveyor.width, layout.conveyor.height)
        } else {
          this.conveyor?.setVisible(false)
        }

        const cardIds = new Set(layout.cards.map((card) => card.id))
        for (const [id, card] of this.cardVisuals) {
          if (cardIds.has(id)) continue
          card.destroy()
          this.cardVisuals.delete(id)
        }
        for (const card of layout.cards) {
          let visual = this.cardVisuals.get(card.id)
          if (!visual) {
            visual = this.add.nineslice(
              0,
              0,
              ART_KEY,
              'card',
              Math.max(52, card.bounds.width),
              Math.max(50, card.bounds.height),
              24,
              24,
              24,
              24,
            ).setOrigin(0.5).setDepth(card.placed ? 6 : 8)
            this.cardVisuals.set(card.id, visual)
          }
          visual
            .setVisible(true)
            .setSize(Math.max(52, card.bounds.width), Math.max(50, card.bounds.height))
        }

        if (layout.mascot) {
          if (!this.mascotPedestal) {
            this.mascotPedestal = this.add.image(0, 0, ART_KEY, 'mascot-pedestal').setOrigin(0.5).setDepth(5)
          }
          const targetWidth = layout.mascot.width * 1.12
          const scale = targetWidth / Math.max(1, this.mascotPedestal.width)
          this.mascotPedestal
            .setVisible(true)
            .setPosition(
              layout.mascot.x + layout.mascot.width * 0.5,
              layout.mascot.y + layout.mascot.height * 0.92,
            )
            .setScale(scale)
        } else {
          this.mascotPedestal?.setVisible(false)
        }
      }

      private syncDynamicVisuals(time: number) {
        const layout = this.layout
        if (!layout) return

        for (const station of layout.stations) {
          const visual = this.stationVisuals.get(station.id)
          const motion = this.stationMotion.get(station.id)
          if (!visual || !motion) continue

          const idle = this.reducedMotion
            ? 1
            : 1 + Math.sin(time * 0.00145 + station.index * 0.8) * 0.0035
          const introScale = 0.88 + motion.intro * 0.12
          const centerX = station.bounds.x + station.bounds.width * 0.5 + motion.feedback.recoil
          const centerY = station.bounds.y + station.bounds.height * 0.5
            + motion.hover.lift * 0.35
            + (1 - motion.intro) * 20
          const combinedScale = motion.hover.scale * motion.feedback.scale * introScale * idle

          visual.shell
            .setPosition(centerX, centerY)
            .setScale(visual.shellScale * combinedScale)
            .setAlpha(motion.intro)

          visual.motif
            .setPosition(
              centerX,
              station.bounds.y + station.bounds.height * 0.50 + motion.hover.lift + (1 - motion.intro) * 12,
            )
            .setScale(visual.motifScale * introScale * motion.hover.scale)
            .setAlpha(motion.intro * 0.92)
        }

        for (const card of layout.cards) {
          const visual = this.cardVisuals.get(card.id)
          if (!visual) continue
          const active = this.interaction.itemId === card.id
          const dragging = active && this.interaction.dragging
          const center = dragging
            ? this.interaction.visualCenter ?? this.interaction.point
            : null
          visual
            .setPosition(
              center?.x ?? card.bounds.x + card.bounds.width * 0.5,
              center?.y ?? card.bounds.y + card.bounds.height * 0.5,
            )
            .setScale(active ? (dragging ? 1.045 : 1.018) : 1)
            .setDepth(dragging ? 17 : card.placed ? 6 : 8)
        }
      }

      private animateActiveStation(activeGroupId: string | null) {
        this.ensureStationMotion()
        for (const [id, motion] of this.stationMotion) {
          this.tweens.killTweensOf(motion.hover)
          const active = id === activeGroupId
          if (this.reducedMotion) {
            motion.hover.lift = active ? -6 : 0
            motion.hover.scale = active ? 1.025 : 1
            continue
          }
          this.tweens.add({
            targets: motion.hover,
            lift: active ? -7 : 0,
            scale: active ? 1.025 : 1,
            duration: 190,
            ease: 'Cubic.Out',
          })
        }
      }

      private animateFeedback(kind: 'correct' | 'wrong', groupId: string) {
        const motion = this.stationMotion.get(groupId)
        const station = this.layout?.stations.find((candidate) => candidate.id === groupId)
        if (!motion || !station) return

        this.tweens.killTweensOf(motion.feedback)
        motion.feedback.kind = kind
        motion.feedback.alpha = 1
        motion.feedback.recoil = 0
        motion.feedback.scale = kind === 'correct' && !this.reducedMotion ? 0.97 : 1

        if (!this.reducedMotion) {
          if (kind === 'correct') {
            this.tweens.chain({
              targets: motion.feedback,
              tweens: [
                { scale: 1.035, duration: 90, ease: 'Sine.Out' },
                { scale: 1, duration: 140, ease: 'Back.Out' },
              ],
            })
            const center = stationPlatformCenter(station.bounds)
            this.particles
              .setEmitterAngle({ min: 198, max: 342 })
              .setParticleSpeed(116)
              .setParticleGravity(0, 118)
              .setParticleLifespan({ min: 380, max: 680 })
              .setParticleTint(particleTints(this.manifest))
            this.particles.explode(18, center.x, center.y)
          } else {
            this.cameras.main.shake(145, 0.0025)
            this.tweens.add({
              targets: motion.feedback,
              recoil: 6,
              duration: 58,
              yoyo: true,
              repeat: 2,
              ease: 'Sine.InOut',
            })
          }
        }

        this.tweens.add({
          targets: motion.feedback,
          alpha: 0,
          delay: kind === 'correct' ? 260 : 190,
          duration: kind === 'correct' ? 360 : 250,
          ease: 'Sine.Out',
          onComplete: () => {
            motion.feedback.kind = null
            motion.feedback.recoil = 0
            motion.feedback.scale = 1
          },
        })
      }

      private snapStationMotion() {
        for (const [id, motion] of this.stationMotion) {
          const active = id === this.interaction.activeGroupId
          motion.intro = 1
          motion.hover.lift = active ? -6 : 0
          motion.hover.scale = active ? 1.025 : 1
          motion.feedback.recoil = 0
          motion.feedback.scale = 1
        }
      }

      private resetVisualState() {
        this.interaction = emptyInteraction()
        this.feedback = null
        this.completeStartedAt = null
        this.particles.killAll()
        this.tweens.killAll()
        this.cameras.main.resetFX()
        for (const motion of this.stationMotion.values()) {
          motion.intro = 1
          motion.hover.lift = 0
          motion.hover.scale = 1
          motion.feedback.alpha = 0
          motion.feedback.recoil = 0
          motion.feedback.scale = 1
          motion.feedback.kind = null
        }
      }

      private drawTrail(time: number) {
        this.trail.clear()
        if (this.reducedMotion || !this.interaction.dragging) return
        const { origin, point } = this.interaction
        if (!origin || !point) return

        const curve = magneticCurve(Phaser, origin, point)
        const accent = hexToNumber(this.manifest.palette.accent)
        strokeCurve(this.trail, curve, 0x184957, 13, 0.09)
        strokeCurve(this.trail, curve, accent, 8, 0.15)
        strokeCurve(this.trail, curve, accent, 3.8, 0.9)
        strokeCurve(this.trail, curve, 0xffffff, 1, 0.42)

        const spark = curve.getPoint((time * 0.00115) % 1)
        this.trail.fillStyle(accent, 0.18)
        this.trail.fillCircle(spark.x, spark.y, 9)
        this.trail.fillStyle(0xffffff, 0.9)
        this.trail.fillCircle(spark.x, spark.y, 2.4)
        this.trail.lineStyle(2, accent, 0.78)
        this.trail.strokeCircle(point.x, point.y, 7)
      }

      private drawFeedback(time: number) {
        this.feedbackFx.clear()
        const layout = this.layout
        const feedback = this.feedback
        if (!layout) return

        if (this.interaction.activeGroupId) {
          const activeStation = layout.stations.find((station) => station.id === this.interaction.activeGroupId)
          if (activeStation) {
            const accent = hexToNumber(this.manifest.palette.accent)
            this.feedbackFx.lineStyle(3.5, accent, 0.72)
            this.feedbackFx.strokeRoundedRect(
              activeStation.bounds.x - 3,
              activeStation.bounds.y - 3,
              activeStation.bounds.width + 6,
              activeStation.bounds.height + 6,
              38,
            )
          }
        }

        for (const station of layout.stations) {
          const motion = this.stationMotion.get(station.id)
          if (!motion?.feedback.kind || motion.feedback.alpha <= 0) continue
          const color = motion.feedback.kind === 'correct'
            ? hexToNumber(this.manifest.palette.success)
            : hexToNumber(this.manifest.palette.danger)
          this.feedbackFx.lineStyle(4.5, color, motion.feedback.alpha * 0.9)
          this.feedbackFx.strokeRoundedRect(
            station.bounds.x - 3,
            station.bounds.y - 3,
            station.bounds.width + 6,
            station.bounds.height + 6,
            38,
          )
        }

        if (feedback) {
          const duration = feedback.kind === 'correct' ? 300 : 440
          const progress = Math.min(1, (time - feedback.startedAt) / duration)
          const station = layout.stations.find((candidate) => candidate.id === feedback.groupId)
          const target = feedback.kind === 'correct' && station
            ? stationPlatformCenter(station.bounds)
            : feedback.origin

          if (!this.reducedMotion && progress < 1) {
            const curve = magneticCurve(Phaser, feedback.from, target)
            const color = hexToNumber(
              feedback.kind === 'correct'
                ? this.manifest.palette.success
                : this.manifest.palette.danger,
            )
            strokeCurve(this.feedbackFx, curve, color, 7, (1 - progress) * 0.26)
            const point = curve.getPoint(easeOutCubic(progress))
            this.feedbackFx.fillStyle(color, 0.2 * (1 - progress))
            this.feedbackFx.fillCircle(point.x, point.y, 11)
            this.feedbackFx.fillStyle(0xffffff, 0.92 * (1 - progress))
            this.feedbackFx.fillCircle(point.x, point.y, 3.2)
          }

          if (progress >= 1) this.feedback = null
        }

        if (this.completeStartedAt !== null && !this.reducedMotion) {
          const elapsed = time - this.completeStartedAt
          if (elapsed < 1150) {
            const alpha = 1 - elapsed / 1150
            const centerX = layout.width * 0.5
            const centerY = layout.height * 0.48
            const radius = 24 + easeOutCubic(Math.min(1, elapsed / 620)) * 86
            this.feedbackFx.lineStyle(3, hexToNumber(this.manifest.palette.success), alpha * 0.38)
            this.feedbackFx.strokeCircle(centerX, centerY, radius)
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
      scene: [GroupSortEffectsScene],
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

function emptyInteraction(): GroupSortRuntimeInteraction {
  return {
    itemId: null,
    origin: null,
    point: null,
    visualCenter: null,
    activeGroupId: null,
    dragging: false,
  }
}

function stationPlatformCenter(bounds: GroupSortRuntimeRect): RuntimePoint {
  return {
    x: bounds.x + bounds.width * 0.5,
    y: bounds.y + bounds.height * 0.82,
  }
}

function magneticCurve(
  Phaser: typeof PhaserType,
  start: RuntimePoint,
  end: RuntimePoint,
) {
  const lift = Math.max(52, Math.abs(end.y - start.y) * 0.34)
  return new Phaser.Curves.CubicBezier(
    new Phaser.Math.Vector2(start.x, start.y),
    new Phaser.Math.Vector2(start.x, start.y - lift),
    new Phaser.Math.Vector2(end.x, end.y + lift * 0.42),
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
  curve.draw(graphics, 30)
}

function particleTints(manifest: ThemeManifest) {
  return [
    hexToNumber(manifest.palette.success),
    hexToNumber(manifest.palette.accent),
    0xffffff,
  ]
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3)
}

function hexToNumber(color: string, fallback = 0x169f9b) {
  const match = color.match(/^#([\da-f]{6})$/i)
  return match ? Number.parseInt(match[1], 16) : fallback
}
