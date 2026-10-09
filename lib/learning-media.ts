export const MAX_LEARNING_IMAGE_SOURCE_LENGTH = 1_000_000

export type LearningImage = {
  kind: 'image'
  src: string
  alt: string
  name: string
  width: number
  height: number
}

export function isLearningImage(input: unknown): input is LearningImage {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false

  const image = input as Record<string, unknown>
  return (
    image.kind === 'image' &&
    typeof image.src === 'string' &&
    isSupportedImageSource(image.src) &&
    image.src.length <= MAX_LEARNING_IMAGE_SOURCE_LENGTH &&
    typeof image.alt === 'string' &&
    image.alt.trim().length > 0 &&
    image.alt.length <= 240 &&
    typeof image.name === 'string' &&
    image.name.trim().length > 0 &&
    image.name.length <= 180 &&
    typeof image.width === 'number' &&
    Number.isFinite(image.width) &&
    image.width > 0 &&
    typeof image.height === 'number' &&
    Number.isFinite(image.height) &&
    image.height > 0
  )
}

function isSupportedImageSource(source: string) {
  return /^data:image\/(?:png|jpeg|webp);base64,/i.test(source)
}
