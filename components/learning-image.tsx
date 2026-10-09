'use client'

import NextImage from 'next/image'
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useId, useState, type ChangeEvent } from 'react'
import {
  MAX_LEARNING_IMAGE_SOURCE_LENGTH,
  type LearningImage,
} from '@/lib/learning-media'

type LearningImageFieldProps = {
  value?: LearningImage
  label: string
  fallbackAlt: string
  compact?: boolean
  emptyLabel?: string
  hideEmptyPreview?: boolean
  onChange: (value: LearningImage | undefined) => void
}

const MAX_SOURCE_BYTES = 8 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function LearningImageField({
  value,
  label,
  fallbackAlt,
  compact = false,
  emptyLabel = 'Add an image',
  hideEmptyPreview = false,
  onChange,
}: LearningImageFieldProps) {
  const inputId = useId()
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setProcessing(true)
    setStatus('Preparing the image...')

    try {
      const image = await prepareLearningImage(file, fallbackAlt)
      onChange(image)
      setStatus('Image added.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The image could not be processed.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <section
      className={`learning-media-field${value ? ' has-image' : ''}${compact ? ' is-compact' : ''}`}
      aria-label={label}
    >
      <input
        id={inputId}
        className="learning-media-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={processing}
        onChange={(event) => void handleFile(event)}
      />

      {value ? (
        <>
          <LearningImageView image={value} className="learning-media-preview" />
          <div className="learning-media-actions">
            <label className="learning-media-action" htmlFor={inputId} aria-disabled={processing}>
              <RefreshCw size={15} />
              {processing ? 'Processing...' : 'Replace'}
            </label>
            <button
              type="button"
              className="learning-media-action is-danger"
              onClick={() => {
                onChange(undefined)
                setStatus('The image has been removed.')
              }}
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
          <label className="learning-media-alt">
            <span>Description for the student</span>
            <input
              value={value.alt}
              maxLength={240}
              onChange={(event) => onChange({ ...value, alt: event.target.value })}
            />
          </label>
        </>
      ) : (
        <label
          className={`learning-media-empty${hideEmptyPreview ? ' without-preview' : ''}`}
          htmlFor={inputId}
          aria-disabled={processing}
        >
          {!hideEmptyPreview ? (
            <span className="learning-media-placeholder" aria-hidden="true">
              <ImagePlus size={18} />
            </span>
          ) : null}
          <span className="learning-media-empty-action">
            <ImagePlus size={16} />
            {processing ? 'Processing...' : emptyLabel}
          </span>
          {!compact ? <small>JPG, PNG or WebP</small> : null}
        </label>
      )}

      {status ? <p className="learning-media-status" role="status">{status}</p> : null}
    </section>
  )
}

export function LearningImageView({
  image,
  className = '',
}: {
  image: LearningImage
  className?: string
}) {
  return (
    <span className={`learning-image ${className}`.trim()}>
      <NextImage
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(max-width: 680px) 38vw, 180px"
        unoptimized
      />
    </span>
  )
}

async function prepareLearningImage(file: File, fallbackAlt: string): Promise<LearningImage> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPG, PNG and WebP are supported.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('The source file must be less than 8 MB.')
  }

  const source = await readFileAsDataUrl(file)
  const decoded = await decodeImage(source)
  const attempts = [
    { maxEdge: 1280, quality: 0.84 },
    { maxEdge: 1024, quality: 0.72 },
    { maxEdge: 820, quality: 0.64 },
  ]

  for (const attempt of attempts) {
    const rendered = renderCompressedImage(decoded, attempt.maxEdge, attempt.quality)
    if (rendered.src.length <= MAX_LEARNING_IMAGE_SOURCE_LENGTH) {
      return {
        kind: 'image',
        src: rendered.src,
        alt: fallbackAlt.trim() || 'Training image',
        name: file.name.slice(0, 180) || 'image',
        width: rendered.width,
        height: rendered.height,
      }
    }
  }

  throw new Error('The image is too complex. Select a smaller file.')
}

function renderCompressedImage(image: HTMLImageElement, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('The browser was unable to render the image.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  return {
    src: canvas.toDataURL('image/webp', quality),
    width,
    height,
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsDataURL(file)
  })
}

function decodeImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The file is not recognized as an image.'))
    image.src = source
  })
}
