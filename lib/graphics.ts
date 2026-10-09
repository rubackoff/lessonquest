export const graphicsStorageKey = 'corgi.graphics.low'

export function lowGraphics() {
  try {
    const stored = localStorage.getItem(graphicsStorageKey)
    if (stored !== null) return stored === 'true'
  } catch { /* Device defaults also work without storage. */ }
  return matchMedia('(max-width: 720px)').matches || navigator.hardwareConcurrency <= 4
}
