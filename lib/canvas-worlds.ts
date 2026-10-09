import type { VisualThemeId } from '@/lib/visual-themes'

export type CanvasWorldPalette = {
  wash: string
  floor: string
  grid: string
  panel: string
  panelBorder: string
  panelInk: string
  surface: string
  surfaceInk: string
  copy: string
  accent: string
  accent2: string
  success: string
  danger: string
  warning: string
  shadow: string
}

export const CANVAS_WORLD_PALETTES: Record<VisualThemeId, CanvasWorldPalette> = {
  'corgi-classic': {
    wash: 'rgba(237, 249, 250, 0.34)',
    floor: 'rgba(213, 238, 241, 0.46)',
    grid: 'rgba(44, 126, 139, 0.14)',
    panel: 'rgba(255, 255, 255, 0.9)',
    panelBorder: 'rgba(31, 105, 122, 0.2)',
    panelInk: '#172033',
    surface: '#f8fcfd',
    surfaceInk: '#172033',
    copy: '#607085',
    accent: '#0b918d',
    accent2: '#ef8b55',
    success: '#24945a',
    danger: '#d94a4e',
    warning: '#d88a25',
    shadow: 'rgba(31, 105, 122, 0.18)',
  },
  'deep-sea': {
    wash: 'rgba(2, 40, 57, 0.2)',
    floor: 'rgba(1, 47, 62, 0.28)',
    grid: 'rgba(171, 243, 239, 0.18)',
    panel: 'rgba(4, 48, 65, 0.88)',
    panelBorder: 'rgba(122, 231, 222, 0.42)',
    panelInk: '#f2feff',
    surface: 'rgba(247, 254, 253, 0.95)',
    surfaceInk: '#103143',
    copy: '#bde7eb',
    accent: '#2ed6c4',
    accent2: '#73cdf7',
    success: '#72d998',
    danger: '#ff7e79',
    warning: '#ffd064',
    shadow: 'rgba(0, 21, 31, 0.3)',
  },
  'space-station': {
    wash: 'rgba(5, 15, 30, 0.2)',
    floor: 'rgba(7, 21, 39, 0.5)',
    grid: 'rgba(104, 202, 249, 0.17)',
    panel: 'rgba(7, 21, 39, 0.88)',
    panelBorder: 'rgba(102, 205, 255, 0.38)',
    panelInk: '#f2f8ff',
    surface: 'rgba(244, 250, 255, 0.96)',
    surfaceInk: '#10263a',
    copy: '#b7d0e7',
    accent: '#4cc6ff',
    accent2: '#987af3',
    success: '#77dfa2',
    danger: '#ff767e',
    warning: '#ffd066',
    shadow: 'rgba(0, 7, 18, 0.38)',
  },
  'paper-workshop': {
    wash: 'rgba(247, 241, 228, 0.16)',
    floor: 'rgba(212, 202, 181, 0.28)',
    grid: 'rgba(89, 76, 53, 0.13)',
    panel: 'rgba(255, 252, 245, 0.92)',
    panelBorder: 'rgba(101, 85, 60, 0.23)',
    panelInk: '#342f28',
    surface: '#fffdf8',
    surfaceInk: '#342f28',
    copy: '#6d6458',
    accent: '#197c73',
    accent2: '#bb6f4b',
    success: '#2f8a58',
    danger: '#c85151',
    warning: '#b87827',
    shadow: 'rgba(75, 60, 38, 0.16)',
  },
  'arcade-city': {
    wash: 'rgba(28, 14, 50, 0.2)',
    floor: 'rgba(25, 10, 48, 0.43)',
    grid: 'rgba(255, 178, 224, 0.18)',
    panel: 'rgba(35, 18, 61, 0.88)',
    panelBorder: 'rgba(255, 144, 208, 0.42)',
    panelInk: '#fff8ff',
    surface: 'rgba(255, 250, 255, 0.96)',
    surfaceInk: '#28173f',
    copy: '#e2d2f8',
    accent: '#ff6481',
    accent2: '#50d7f2',
    success: '#7ce09a',
    danger: '#ff7b78',
    warning: '#ffd262',
    shadow: 'rgba(13, 3, 28, 0.38)',
  },
}

export function drawCanvasWorldBackdrop(
  context: CanvasRenderingContext2D,
  themeId: VisualThemeId,
  time: number,
  motionEnabled: boolean,
  width: number,
  height: number,
  floorY: number,
) {
  const palette = CANVAS_WORLD_PALETTES[themeId]
  const sceneTime = motionEnabled ? time : 0

  context.fillStyle = palette.wash
  context.fillRect(0, 0, width, height)
  context.fillStyle = palette.floor
  context.fillRect(0, floorY, width, height - floorY)

  if (themeId === 'deep-sea') {
    context.strokeStyle = palette.grid
    context.lineWidth = 2
    for (let index = 0; index < 12; index += 1) {
      const radius = 5 + (index % 4) * 4
      const x = 48 + ((index * 137) % Math.max(1, width - 80))
      const travel = (sceneTime / (18 + (index % 3) * 7) + index * 71) % (height + 90)
      const y = height + 30 - travel
      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.stroke()
    }
    return
  }

  if (themeId === 'space-station') {
    context.fillStyle = palette.grid
    for (let index = 0; index < 48; index += 1) {
      const x = (index * 83 + 31) % width
      const y = (index * 47 + 19) % floorY
      const pulse = motionEnabled ? 0.65 + Math.sin(sceneTime / 420 + index) * 0.3 : 0.8
      context.globalAlpha = pulse
      context.fillRect(x, y, index % 5 === 0 ? 3 : 2, index % 5 === 0 ? 3 : 2)
    }
    context.globalAlpha = 1
    return
  }

  context.strokeStyle = palette.grid
  context.lineWidth = 1

  if (themeId === 'paper-workshop') {
    for (let y = 30; y < height; y += 32) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }
    return
  }

  const offset = motionEnabled ? (sceneTime / 34) % 52 : 0
  for (let x = -120; x < width + 120; x += 52) {
    context.beginPath()
    context.moveTo(x + offset, floorY)
    context.lineTo(x - 140 + offset, height)
    context.stroke()
  }
}
