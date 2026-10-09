import type { PhaserRuntimeFactory } from '@/lib/game-runtime/contracts'

export const createTransparentRuntime: PhaserRuntimeFactory = ({
  Phaser,
  parent,
}) => {
  class RuntimeFoundationScene extends Phaser.Scene {
    constructor() {
      super('runtime-foundation')
    }
  }

  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: Math.max(1, parent.clientWidth),
    height: Math.max(1, parent.clientHeight),
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    scene: [RuntimeFoundationScene],
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
