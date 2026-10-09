import type PhaserType from 'phaser'
import { RuntimeBridge } from '@/lib/game-runtime/bridge'
import type { PhaserRuntimeFactory, RuntimePoint } from '@/lib/game-runtime/contracts'

export type ForceLabRuntimeState = {
  levelId: number
  force: number
  angle: number
  targetForce: number
  targetAngle: number
  answerCorrect: boolean
  vectorAligned: boolean
  gateOpen: boolean
  forceGap: number
  angleGap: number
  efficiency: number
  running: boolean
}

export type ForceLabVisualCommand =
  | { type: 'force/state'; state: ForceLabRuntimeState }
  | { type: 'force/focus'; focused: boolean }
  | { type: 'force/reset' }

export type ForceLabRuntimeEvent =
  | { type: 'force/vector-change'; force: number; angle: number }
  | { type: 'force/drag-state'; dragging: boolean }

export type ForceLabVisualBridge = RuntimeBridge<ForceLabVisualCommand, ForceLabRuntimeEvent>

type Graphics = PhaserType.GameObjects.Graphics

const PARTICLE_TEXTURE = 'force-lab-particle'
const CORGI_TEXTURE = 'force-lab-corgi'
const ORIGIN_X = 0.365
const ORIGIN_Y = 0.69
const MAX_VECTOR_WIDTH = 0.37
const FORCE_MIN = 1
const FORCE_MAX = 18
const ANGLE_MIN = 0
const ANGLE_MAX = 55

const colors = {
  ink: 0x17313d,
  accent: 0x12aaa7,
  accentBright: 0x64ddd2,
  success: 0x15945b,
  coral: 0xe87565,
  sky: 0x6aaed4,
  white: 0xffffff,
  panel: 0xf8fcfb,
  panelEdge: 0xc8dddc,
  floor: 0xe7f1ef,
  floorLine: 0xaedbd5,
  wheel: 0x263943,
  wheelHub: 0xa9c3c4,
}

const initialState: ForceLabRuntimeState = {
  levelId: 0,
  force: 6,
  angle: 18,
  targetForce: 8,
  targetAngle: 24,
  answerCorrect: false,
  vectorAligned: false,
  gateOpen: false,
  forceGap: 2,
  angleGap: 6,
  efficiency: 70,
  running: true,
}

export function createForceLabRuntime(
  visualBridge: ForceLabVisualBridge,
): PhaserRuntimeFactory {
  return ({ Phaser, parent, bridge }) => {
    class ForceLabScene extends Phaser.Scene {
      private backdrop!: Graphics
      private architecture!: Graphics
      private machine!: Graphics
      private vectors!: Graphics
      private effects!: Graphics
      private inputZone!: PhaserType.GameObjects.Zone
      private corgi!: PhaserType.GameObjects.Image
      private particles!: PhaserType.GameObjects.Particles.ParticleEmitter
      private state: ForceLabRuntimeState = initialState
      private reducedMotion = false
      private dragging = false
      private focused = false
      private disposed = false
      private alignStartedAt: number | null = null
      private motion = { gate: 0, rover: 0 }
      private unsubscribeLifecycle: (() => boolean) | null = null
      private unsubscribeVisual: (() => boolean) | null = null

      constructor() {
        super('force-lab-scene')
      }

      preload() {
        this.load.image(CORGI_TEXTURE, '/corgi-coach-full-v3.png')
      }

      create() {
        this.cameras.main.setBackgroundColor('#f5faf9')
        this.backdrop = this.add.graphics().setDepth(0)
        this.architecture = this.add.graphics().setDepth(1)
        this.machine = this.add.graphics().setDepth(3)
        this.vectors = this.add.graphics().setDepth(5)
        this.effects = this.add.graphics().setDepth(7)
        this.corgi = this.add.image(0, 0, CORGI_TEXTURE).setOrigin(0.5, 1).setDepth(4)
        this.inputZone = this.add.zone(0, 0, 94, 94).setInteractive({ useHandCursor: true }).setDepth(12)

        this.createParticleTexture()
        this.particles = this.add.particles(0, 0, PARTICLE_TEXTURE, {
          emitting: false,
          reserve: 56,
          maxParticles: 86,
          lifespan: { min: 360, max: 680 },
          speed: { min: 56, max: 136 },
          angle: { min: 195, max: 345 },
          gravityY: 38,
          scale: { start: 0.82, end: 0 },
          alpha: { start: 0.88, end: 0 },
          tint: [colors.accent, colors.accentBright, colors.white],
          blendMode: Phaser.BlendModes.ADD,
        }).setDepth(8)

        this.inputZone.on('pointerdown', (pointer: PhaserType.Input.Pointer) => {
          if (!this.state.running || this.state.gateOpen) return
          this.dragging = true
          visualBridge.emitEvent({ type: 'force/drag-state', dragging: true })
          this.updateVectorFromPointer(pointer)
        })

        this.input.on('pointermove', (pointer: PhaserType.Input.Pointer) => {
          if (!this.dragging || !pointer.isDown) return
          this.updateVectorFromPointer(pointer)
        })

        this.input.on('pointerup', () => this.finishDrag())
        this.input.on('gameout', () => this.finishDrag())

        this.unsubscribeLifecycle = bridge.subscribeCommands((command) => {
          if (this.disposed || command.type !== 'runtime/reduced-motion') return
          this.reducedMotion = command.enabled
          if (command.enabled) {
            this.tweens.killAll()
            this.particles.killAll()
            this.motion.gate = this.state.gateOpen ? 1 : 0
            this.motion.rover = this.state.gateOpen ? 1 : 0
          }
        })

        this.unsubscribeVisual = visualBridge.subscribeCommands((command) => {
          if (this.disposed) return
          if (command.type === 'force/focus') {
            this.focused = command.focused
            return
          }
          if (command.type === 'force/reset') {
            this.resetScene()
            return
          }
          this.applyState(command.state)
        })

        const dispose = () => {
          if (this.disposed) return
          this.disposed = true
          this.finishDrag()
          this.unsubscribeLifecycle?.()
          this.unsubscribeVisual?.()
          this.unsubscribeLifecycle = null
          this.unsubscribeVisual = null
        }

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose)
        this.events.once(Phaser.Scenes.Events.DESTROY, dispose)
      }

      update(time: number) {
        const width = Math.max(1, this.scale.width)
        const height = Math.max(1, this.scale.height)
        const origin = getOrigin(width, height)
        const endpoint = getVectorEndpoint(width, height, this.state.force, this.state.angle)
        const target = getVectorEndpoint(width, height, this.state.targetForce, this.state.targetAngle)

        this.inputZone.setPosition(endpoint.x, endpoint.y)
        this.drawBackdrop(width, height, time)
        this.drawArchitecture(width, height, time)
        this.drawMachine(width, height, origin, time)
        this.drawVectorField(width, height, origin, endpoint, target, time)
        this.drawEffects(width, height, target, time)
        this.placeCorgi(width, height, time)
      }

      private applyState(nextState: ForceLabRuntimeState) {
        const previous = this.state
        this.state = nextState

        if (!nextState.running || nextState.gateOpen) this.finishDrag()
        if (previous.levelId !== nextState.levelId) this.resetScene()

        if (!previous.vectorAligned && nextState.vectorAligned) {
          this.alignStartedAt = this.time.now
          this.burstAtTarget(nextState.gateOpen ? 20 : 11)
        }

        if (previous.gateOpen !== nextState.gateOpen) {
          this.animateGate(nextState.gateOpen)
        }
      }

      private resetScene() {
        this.finishDrag()
        this.tweens.killAll()
        this.particles?.killAll()
        this.alignStartedAt = null
        this.motion.gate = this.state.gateOpen ? 1 : 0
        this.motion.rover = this.state.gateOpen ? 1 : 0
      }

      private animateGate(open: boolean) {
        this.tweens.killTweensOf(this.motion)
        if (this.reducedMotion) {
          this.motion.gate = open ? 1 : 0
          this.motion.rover = open ? 1 : 0
          return
        }
        this.tweens.add({
          targets: this.motion,
          gate: open ? 1 : 0,
          duration: 440,
          ease: 'Back.Out',
        })
        this.tweens.add({
          targets: this.motion,
          rover: open ? 1 : 0,
          delay: open ? 180 : 0,
          duration: open ? 980 : 360,
          ease: open ? 'Cubic.InOut' : 'Cubic.Out',
        })
        if (open) this.burstAtTarget(24)
      }

      private updateVectorFromPointer(pointer: PhaserType.Input.Pointer) {
        const width = Math.max(1, this.scale.width)
        const height = Math.max(1, this.scale.height)
        const origin = getOrigin(width, height)
        const dx = pointer.x - origin.x
        const dy = origin.y - pointer.y
        const angle = clampNumber(
          Math.round((Math.atan2(dy, Math.max(dx, 1)) * 180) / Math.PI),
          ANGLE_MIN,
          ANGLE_MAX,
        )
        const force = clampNumber(
          Math.round((Math.hypot(dx, dy) / (width * MAX_VECTOR_WIDTH)) * FORCE_MAX),
          FORCE_MIN,
          FORCE_MAX,
        )

        if (force === this.state.force && angle === this.state.angle) return
        this.state = { ...this.state, force, angle }
        visualBridge.emitEvent({ type: 'force/vector-change', force, angle })
      }

      private finishDrag() {
        if (!this.dragging) return
        this.dragging = false
        visualBridge.emitEvent({ type: 'force/drag-state', dragging: false })
      }

      private burstAtTarget(count: number) {
        if (this.reducedMotion || !this.particles) return
        const target = getVectorEndpoint(
          Math.max(1, this.scale.width),
          Math.max(1, this.scale.height),
          this.state.targetForce,
          this.state.targetAngle,
        )
        this.particles.setParticleTint(
          this.state.gateOpen
            ? [colors.success, colors.accent, colors.white]
            : [colors.accent, colors.accentBright, colors.white],
        )
        this.particles.explode(count, target.x, target.y)
      }

      private createParticleTexture() {
        if (this.textures.exists(PARTICLE_TEXTURE)) return
        const texture = this.add.graphics()
        texture.fillStyle(colors.white, 1)
        texture.fillCircle(5, 5, 4)
        texture.generateTexture(PARTICLE_TEXTURE, 10, 10)
        texture.destroy()
      }

      private drawBackdrop(width: number, height: number, time: number) {
        const graphics = this.backdrop
        graphics.clear()
        graphics.fillGradientStyle(0xffffff, 0xf7fbfa, 0xe8f4f1, 0xf5f8f7, 1)
        graphics.fillRect(0, 0, width, height)

        const glowX = width * 0.57 + Math.sin(time * 0.00024) * width * 0.015
        graphics.fillStyle(0xffffff, 0.48)
        graphics.fillCircle(glowX, height * 0.12, Math.max(width, height) * 0.42)

        graphics.fillStyle(0xdbeceb, 0.34)
        graphics.fillRoundedRect(width * 0.045, height * 0.055, width * 0.91, height * 0.38, 24)
        graphics.lineStyle(2, colors.white, 0.78)
        graphics.strokeRoundedRect(width * 0.045, height * 0.055, width * 0.91, height * 0.38, 24)

        for (let column = 1; column < 7; column += 1) {
          const x = width * (0.045 + (0.91 / 7) * column)
          graphics.lineStyle(1, 0xaed4d2, 0.15)
          graphics.lineBetween(x, height * 0.065, x, height * 0.425)
        }

        graphics.fillGradientStyle(0xf8fbfb, 0xf6faf9, 0xdfeceb, 0xeef5f4, 1)
        graphics.fillRect(0, height * 0.43, width, height * 0.57)

        const horizonY = height * 0.48
        graphics.lineStyle(1, colors.floorLine, 0.2)
        for (let line = 0; line <= 9; line += 1) {
          const x = width * (line / 9)
          graphics.lineBetween(width * 0.51, horizonY, x, height)
        }
        for (let row = 1; row <= 7; row += 1) {
          const progress = row / 7
          const y = horizonY + Math.pow(progress, 1.65) * (height - horizonY)
          graphics.lineBetween(0, y, width, y)
        }
      }

      private drawArchitecture(width: number, height: number, time: number) {
        const graphics = this.architecture
        graphics.clear()

        const panelX = width * 0.3
        const panelY = height * 0.1
        graphics.fillStyle(colors.white, 0.36)
        graphics.fillRoundedRect(panelX, panelY, width * 0.2, height * 0.23, 18)
        graphics.lineStyle(2, colors.accent, 0.1)
        graphics.strokeCircle(panelX + width * 0.055, panelY + height * 0.09, height * 0.035)
        graphics.strokeCircle(panelX + width * 0.055, panelY + height * 0.09, height * 0.062)
        graphics.lineBetween(panelX + width * 0.12, panelY + height * 0.17, panelX + width * 0.12, panelY + height * 0.065)
        graphics.lineBetween(panelX + width * 0.12, panelY + height * 0.17, panelX + width * 0.185, panelY + height * 0.17)
        graphics.lineStyle(3, colors.accent, 0.13)
        graphics.lineBetween(panelX + width * 0.13, panelY + height * 0.15, panelX + width * 0.18, panelY + height * 0.085)

        const benchY = height * 0.78
        graphics.fillStyle(0xffffff, 0.72)
        graphics.fillRoundedRect(width * 0.045, benchY, width * 0.91, height * 0.17, 28)
        graphics.lineStyle(3, 0x9fbbbe, 0.38)
        graphics.strokeRoundedRect(width * 0.045, benchY, width * 0.91, height * 0.17, 28)
        graphics.lineStyle(1, colors.accent, 0.15)
        graphics.lineBetween(width * 0.08, benchY + height * 0.055, width * 0.91, benchY + height * 0.055)

        const scanner = (time * 0.045) % Math.max(1, width * 0.46)
        graphics.fillStyle(colors.accentBright, this.reducedMotion ? 0 : 0.06)
        graphics.fillRect(width * 0.43 + scanner, benchY + 4, 3, height * 0.13)
      }

      private drawMachine(width: number, height: number, origin: RuntimePoint, time: number) {
        const graphics = this.machine
        graphics.clear()

        const compact = width < 640
        const gateWidth = compact ? Math.max(82, width * 0.22) : Math.max(126, width * 0.125)
        const gateX = compact ? width - gateWidth - 16 : width * 0.83
        const gateTop = height * 0.2
        const gateHeight = height * (compact ? 0.4 : 0.47)
        const gateSpread = this.motion.gate * Math.min(22, gateWidth * 0.13)
        const gateGlow = this.motion.gate > 0
          ? 0.17 + Math.sin(time * 0.006) * 0.04
          : 0.08

        graphics.fillStyle(this.state.gateOpen ? colors.success : colors.accent, gateGlow)
        graphics.fillRoundedRect(gateX - gateWidth * 0.12, gateTop - 18, gateWidth * 1.24, gateHeight + 34, 30)

        graphics.lineStyle(Math.max(14, width * 0.012), 0xdbe6e6, 1)
        graphics.beginPath()
        graphics.moveTo(gateX - gateSpread, gateTop + gateHeight)
        graphics.lineTo(gateX - gateSpread, gateTop + 28)
        graphics.lineTo(gateX + gateWidth * 0.16, gateTop)
        graphics.lineTo(gateX + gateWidth * 0.84, gateTop)
        graphics.lineTo(gateX + gateWidth + gateSpread, gateTop + 28)
        graphics.lineTo(gateX + gateWidth + gateSpread, gateTop + gateHeight)
        graphics.strokePath()

        graphics.lineStyle(Math.max(6, width * 0.0055), this.state.gateOpen ? colors.success : colors.accentBright, 0.88)
        graphics.beginPath()
        graphics.moveTo(gateX + 2 - gateSpread, gateTop + gateHeight - 3)
        graphics.lineTo(gateX + 2 - gateSpread, gateTop + 34)
        graphics.lineTo(gateX + gateWidth * 0.18, gateTop + 8)
        graphics.lineTo(gateX + gateWidth * 0.82, gateTop + 8)
        graphics.lineTo(gateX + gateWidth - 2 + gateSpread, gateTop + 34)
        graphics.lineTo(gateX + gateWidth - 2 + gateSpread, gateTop + gateHeight - 3)
        graphics.strokePath()

        graphics.fillStyle(colors.white, 0.95)
        graphics.fillCircle(gateX + gateWidth * 0.5, gateTop - 4, 24)
        graphics.lineStyle(2, colors.panelEdge, 0.72)
        graphics.strokeCircle(gateX + gateWidth * 0.5, gateTop - 4, 24)
        graphics.fillStyle(this.state.gateOpen ? colors.success : colors.accent, 1)
        graphics.fillRect(gateX + gateWidth * 0.5 - 7, gateTop - 12, 3, 17)
        graphics.fillTriangle(
          gateX + gateWidth * 0.5 - 4,
          gateTop - 12,
          gateX + gateWidth * 0.5 + 10,
          gateTop - 7,
          gateX + gateWidth * 0.5 - 4,
          gateTop - 2,
        )

        const roverStartX = origin.x - Math.min(112, width * 0.075)
        const roverTargetX = gateX - gateWidth * 0.55
        const roverX = roverStartX + (roverTargetX - roverStartX) * this.motion.rover
        const roverY = origin.y + Math.min(46, height * 0.07)
        const roverScale = clampNumber(width / 1450, 0.72, 1.12)
        this.drawRover(graphics, roverX, roverY, roverScale)
      }

      private drawRover(graphics: Graphics, x: number, y: number, scale: number) {
        const bodyWidth = 126 * scale
        const bodyHeight = 66 * scale
        const wheelRadius = 24 * scale

        graphics.fillStyle(0x1b303a, 0.14)
        graphics.fillEllipse(x, y + wheelRadius * 0.7, bodyWidth * 1.25, wheelRadius * 0.85)

        for (const wheelX of [x - bodyWidth * 0.37, x + bodyWidth * 0.37]) {
          graphics.fillStyle(colors.wheel, 1)
          graphics.fillCircle(wheelX, y + bodyHeight * 0.26, wheelRadius)
          graphics.lineStyle(3 * scale, 0x5b7077, 0.72)
          graphics.strokeCircle(wheelX, y + bodyHeight * 0.26, wheelRadius * 0.72)
          graphics.fillStyle(colors.wheelHub, 1)
          graphics.fillCircle(wheelX, y + bodyHeight * 0.26, wheelRadius * 0.38)
        }

        graphics.fillStyle(0xf5faf9, 1)
        graphics.fillRoundedRect(x - bodyWidth * 0.5, y - bodyHeight * 0.65, bodyWidth, bodyHeight, 15 * scale)
        graphics.lineStyle(3 * scale, 0xaac7c7, 0.9)
        graphics.strokeRoundedRect(x - bodyWidth * 0.5, y - bodyHeight * 0.65, bodyWidth, bodyHeight, 15 * scale)

        graphics.fillStyle(colors.accent, 0.96)
        graphics.fillRoundedRect(x - bodyWidth * 0.24, y - bodyHeight * 0.38, bodyWidth * 0.48, bodyHeight * 0.42, 8 * scale)
        graphics.fillStyle(colors.white, 0.96)
        graphics.fillCircle(x - bodyWidth * 0.07, y - bodyHeight * 0.17, 4.5 * scale)
        graphics.fillCircle(x + bodyWidth * 0.07, y - bodyHeight * 0.17, 4.5 * scale)
        graphics.lineStyle(3 * scale, colors.white, 0.96)
        graphics.lineBetween(x - bodyWidth * 0.08, y - bodyHeight * 0.04, x + bodyWidth * 0.08, y - bodyHeight * 0.04)

        graphics.lineStyle(3 * scale, 0x8eaaad, 0.92)
        graphics.lineBetween(x - bodyWidth * 0.34, y - bodyHeight * 0.65, x - bodyWidth * 0.34, y - bodyHeight * 1.04)
        graphics.fillStyle(colors.accentBright, 1)
        graphics.fillCircle(x - bodyWidth * 0.34, y - bodyHeight * 1.05, 5 * scale)

        graphics.fillStyle(0xdbe9e8, 1)
        graphics.fillEllipse(x, y - bodyHeight * 0.71, bodyWidth * 0.52, bodyHeight * 0.22)
        graphics.lineStyle(3 * scale, colors.accent, 0.78)
        graphics.strokeEllipse(x, y - bodyHeight * 0.71, bodyWidth * 0.42, bodyHeight * 0.14)
      }

      private drawVectorField(
        width: number,
        height: number,
        origin: RuntimePoint,
        endpoint: RuntimePoint,
        target: RuntimePoint,
        time: number,
      ) {
        const graphics = this.vectors
        graphics.clear()
        const nearTarget = this.state.forceGap <= 2 && this.state.angleGap <= 8
        const vectorColor = this.state.vectorAligned ? colors.success : colors.accent
        const vectorAlpha = 1 - this.motion.rover * 0.8

        graphics.lineStyle(3, colors.accent, 0.23)
        graphics.lineBetween(origin.x, origin.y, target.x, target.y)
        drawArrow(graphics, origin, target, colors.accent, 3, 0.23)

        const pulse = this.reducedMotion ? 0 : Math.sin(time * 0.004) * 4
        graphics.lineStyle(2, nearTarget ? colors.success : colors.accent, nearTarget ? 0.58 : 0.4)
        graphics.strokeCircle(target.x, target.y, 76 + pulse)
        graphics.lineStyle(2, colors.accent, 0.28)
        graphics.strokeCircle(target.x, target.y, 116 + pulse * 0.65)
        graphics.strokeCircle(target.x, target.y, 38)
        graphics.lineBetween(target.x - 136, target.y, target.x - 92, target.y)
        graphics.lineBetween(target.x + 92, target.y, target.x + 136, target.y)
        graphics.lineBetween(target.x, target.y - 136, target.x, target.y - 92)
        graphics.lineBetween(target.x, target.y + 92, target.x, target.y + 136)

        graphics.fillStyle(nearTarget ? colors.success : colors.accent, nearTarget ? 0.14 : 0.1)
        graphics.fillCircle(target.x, target.y, 68 + pulse)

        drawArrow(graphics, origin, endpoint, 0x255a63, 14, 0.12 * vectorAlpha)
        drawArrow(graphics, origin, endpoint, vectorColor, 8, 0.96 * vectorAlpha)
        drawArrow(graphics, origin, endpoint, colors.accentBright, 2, 0.88 * vectorAlpha)
        drawAngleArc(graphics, origin, this.state.angle, Math.min(width * 0.075, height * 0.13), vectorColor)

        const focusPulse = this.focused && !this.reducedMotion ? Math.sin(time * 0.008) * 4 : 0
        graphics.fillStyle(colors.ink, 0.13)
        graphics.fillCircle(endpoint.x, endpoint.y + 5, 29)
        graphics.fillStyle(colors.white, 1)
        graphics.fillCircle(endpoint.x, endpoint.y, 28)
        graphics.lineStyle(this.focused ? 5 : 3, this.focused ? colors.sky : vectorColor, this.focused ? 0.95 : 0.72)
        graphics.strokeCircle(endpoint.x, endpoint.y, 28 + focusPulse)
        graphics.fillStyle(vectorColor, 1)
        graphics.fillCircle(endpoint.x, endpoint.y, 18)
        graphics.fillStyle(colors.white, 0.78)
        graphics.fillCircle(endpoint.x - 5, endpoint.y - 6, 5)

        graphics.fillStyle(0xd6e5e4, 1)
        graphics.fillCircle(origin.x, origin.y, 14)
        graphics.lineStyle(4, colors.accent, 0.86)
        graphics.strokeCircle(origin.x, origin.y, 11)

        if (!this.state.running && !this.state.gateOpen) {
          graphics.fillStyle(colors.white, 0.4)
          graphics.fillRect(0, 0, width, height)
        }
      }

      private drawEffects(width: number, height: number, target: RuntimePoint, time: number) {
        const graphics = this.effects
        graphics.clear()

        if (this.alignStartedAt !== null && !this.reducedMotion) {
          const elapsed = time - this.alignStartedAt
          if (elapsed < 760) {
            const progress = elapsed / 760
            graphics.lineStyle(4, this.state.gateOpen ? colors.success : colors.accent, (1 - progress) * 0.55)
            graphics.strokeCircle(target.x, target.y, 24 + easeOutCubic(progress) * 112)
          } else {
            this.alignStartedAt = null
          }
        }

        if (this.state.gateOpen) {
          const gateX = width * 0.83
          const gateY = height * 0.43
          const shimmer = this.reducedMotion ? 0.13 : 0.12 + Math.sin(time * 0.006) * 0.035
          graphics.fillStyle(colors.success, shimmer)
          graphics.fillEllipse(gateX + width * 0.06, gateY, width * 0.17, height * 0.49)
        }
      }

      private placeCorgi(width: number, height: number, time: number) {
        const compact = width < 640
        const size = compact
          ? clampNumber(Math.min(width * 0.27, height * 0.32), 106, 150)
          : clampNumber(Math.min(width * 0.17, height * 0.36), 96, 224)
        const bob = this.reducedMotion ? 0 : Math.sin(time * 0.0022) * 2.4
        this.corgi.setDisplaySize(size, size)
        this.corgi.setPosition(size * 0.53 + 18, height - 18 + bob)
        this.corgi.setAlpha(this.state.gateOpen ? 1 : 0.96)
      }
    }

    return new Phaser.Game({
      type: Phaser.WEBGL,
      parent,
      width: Math.max(1, parent.clientWidth),
      height: Math.max(1, parent.clientHeight),
      backgroundColor: '#f5faf9',
      scene: [ForceLabScene],
      audio: { noAudio: true },
      input: {
        keyboard: false,
        gamepad: false,
        mouse: true,
        touch: true,
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

function getOrigin(width: number, height: number): RuntimePoint {
  return { x: width * ORIGIN_X, y: height * ORIGIN_Y }
}

function getVectorEndpoint(
  width: number,
  height: number,
  force: number,
  angle: number,
): RuntimePoint {
  const origin = getOrigin(width, height)
  const length = width * MAX_VECTOR_WIDTH * (force / FORCE_MAX)
  const radians = (angle * Math.PI) / 180
  return {
    x: origin.x + Math.cos(radians) * length,
    y: origin.y - Math.sin(radians) * length,
  }
}

function drawArrow(
  graphics: Graphics,
  start: RuntimePoint,
  end: RuntimePoint,
  color: number,
  width: number,
  alpha: number,
) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const head = Math.max(12, width * 2.2)
  const lineEnd = {
    x: end.x - Math.cos(angle) * head * 0.55,
    y: end.y - Math.sin(angle) * head * 0.55,
  }
  graphics.lineStyle(width, color, alpha)
  graphics.lineBetween(start.x, start.y, lineEnd.x, lineEnd.y)
  graphics.fillStyle(color, alpha)
  graphics.fillTriangle(
    end.x,
    end.y,
    end.x - Math.cos(angle - 0.58) * head,
    end.y - Math.sin(angle - 0.58) * head,
    end.x - Math.cos(angle + 0.58) * head,
    end.y - Math.sin(angle + 0.58) * head,
  )
}

function drawAngleArc(
  graphics: Graphics,
  origin: RuntimePoint,
  angle: number,
  radius: number,
  color: number,
) {
  const steps = Math.max(3, Math.ceil(angle / 4))
  graphics.lineStyle(2, color, 0.68)
  for (let index = 0; index < steps; index += 1) {
    const startAngle = ((angle / steps) * index * Math.PI) / 180
    const endAngle = ((angle / steps) * (index + 1) * Math.PI) / 180
    graphics.lineBetween(
      origin.x + Math.cos(startAngle) * radius,
      origin.y - Math.sin(startAngle) * radius,
      origin.x + Math.cos(endAngle) * radius,
      origin.y - Math.sin(endAngle) * radius,
    )
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function easeOutCubic(value: number) {
  const clamped = clampNumber(value, 0, 1)
  return 1 - Math.pow(1 - clamped, 3)
}
