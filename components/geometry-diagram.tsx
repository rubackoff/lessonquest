import type { GeometryDiagramSpec } from '@/lib/geometry-diagrams'

type GeometryDiagramProps = {
  spec: GeometryDiagramSpec
  compact?: boolean
  decorative?: boolean
}

export function GeometryDiagram({ spec, compact = false, decorative = false }: GeometryDiagramProps) {
  return (
    <span className={compact ? 'geometry-diagram is-compact' : 'geometry-diagram'}>
      <svg
        viewBox="0 0 120 84"
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : spec.label}
        aria-hidden={decorative || undefined}
      >
        <DiagramShape spec={spec} />
      </svg>
      {!compact && !decorative ? <small>{spec.label}</small> : null}
    </span>
  )
}

function DiagramShape({ spec }: { spec: GeometryDiagramSpec }) {
  if (spec.kind === 'triangle') return <Triangle variant={spec.variant} />
  if (spec.kind === 'quadrilateral') return <Quadrilateral variant={spec.variant} />
  if (spec.kind === 'circle') return <CircleDiagram variant={spec.variant} />
  if (spec.kind === 'angle') return <AngleDiagram variant={spec.variant} />
  if (spec.kind === 'plot') return <PlotDiagram variant={spec.variant} />
  return <SolidDiagram variant={spec.variant} />
}

function Triangle({ variant }: { variant: string }) {
  const points =
    variant === 'equilateral'
      ? '60,10 18,72 102,72'
      : variant === 'isosceles'
        ? '60,8 28,72 92,72'
        : variant === 'right'
          ? '25,12 25,72 102,72'
          : '34,10 18,72 106,72'

  return (
    <g className="geometry-stroke">
      <polygon points={points} />
      {variant === 'right' ? <polyline points="25,61 36,61 36,72" /> : null}
      {variant === 'equilateral' ? (
        <>
          <line x1="37" y1="40" x2="44" y2="45" />
          <line x1="76" y1="45" x2="83" y2="40" />
          <line x1="57" y1="69" x2="63" y2="69" />
        </>
      ) : null}
    </g>
  )
}

function Quadrilateral({ variant }: { variant: string }) {
  const points =
    variant === 'square'
      ? '30,12 90,12 90,72 30,72'
      : variant === 'rectangle'
        ? '14,22 106,22 106,66 14,66'
        : variant === 'rhombus'
          ? '60,8 105,42 60,76 15,42'
          : '36,14 86,14 108,70 14,70'

  return <polygon className="geometry-stroke" points={points} />
}

function CircleDiagram({ variant }: { variant: string }) {
  return (
    <g className="geometry-stroke">
      <circle cx="60" cy="42" r="32" />
      <circle className="geometry-fill" cx="60" cy="42" r="2.5" />
      {variant === 'radius' ? <line x1="60" y1="42" x2="91" y2="42" /> : null}
      {variant === 'diameter' ? <line x1="28" y1="42" x2="92" y2="42" /> : null}
      {variant === 'chord' ? <line x1="38" y1="23" x2="87" y2="58" /> : null}
      {variant === 'sector' ? (
        <>
          <line x1="60" y1="42" x2="60" y2="10" />
          <line x1="60" y1="42" x2="89" y2="56" />
          <path className="geometry-soft-fill" d="M60 10 A32 32 0 0 1 89 56 L60 42 Z" />
        </>
      ) : null}
    </g>
  )
}

function AngleDiagram({ variant }: { variant: string }) {
  const end =
    variant === 'acute'
      ? { x: 96, y: 18 }
      : variant === 'right'
        ? { x: 48, y: 10 }
        : variant === 'obtuse'
          ? { x: 16, y: 18 }
          : { x: 10, y: 58 }

  return (
    <g className="geometry-stroke">
      <line x1="48" y1="58" x2="106" y2="58" />
      <line x1="48" y1="58" x2={end.x} y2={end.y} />
      {variant === 'right' ? <polyline points="48,46 60,46 60,58" /> : null}
      {variant !== 'straight' ? <path d="M70 58 A22 22 0 0 0 62 42" /> : null}
      <circle className="geometry-fill" cx="48" cy="58" r="2.5" />
    </g>
  )
}

function PlotDiagram({ variant }: { variant: string }) {
  const curve =
    variant === 'linear-up'
      ? 'M18 68 L102 16'
      : variant === 'linear-down'
        ? 'M18 16 L102 68'
        : variant === 'quadratic'
          ? 'M20 18 Q60 102 100 18'
          : 'M16 22 C35 23 39 31 46 40 M74 44 C81 54 85 62 104 64'

  return (
    <g className="geometry-stroke">
      <line className="geometry-axis" x1="12" y1="42" x2="108" y2="42" />
      <line className="geometry-axis" x1="60" y1="8" x2="60" y2="76" />
      <path className="geometry-curve" d={curve} />
    </g>
  )
}

function SolidDiagram({ variant }: { variant: string }) {
  if (variant === 'cylinder') {
    return (
      <g className="geometry-stroke">
        <ellipse cx="60" cy="18" rx="28" ry="10" />
        <line x1="32" y1="18" x2="32" y2="64" />
        <line x1="88" y1="18" x2="88" y2="64" />
        <path d="M32 64 A28 10 0 0 0 88 64" />
      </g>
    )
  }

  if (variant === 'cone') {
    return (
      <g className="geometry-stroke">
        <line x1="60" y1="8" x2="28" y2="66" />
        <line x1="60" y1="8" x2="92" y2="66" />
        <ellipse cx="60" cy="66" rx="32" ry="9" />
      </g>
    )
  }

  const back = variant === 'prism' ? '34,10 88,10 104,28 50,28' : '28,14 82,14 96,28 42,28'
  const front = variant === 'prism' ? '18,36 72,36 88,72 34,72' : '28,28 82,28 82,72 28,72'

  return (
    <g className="geometry-stroke">
      <polygon points={back} />
      <polygon points={front} />
      <line x1="28" y1="28" x2="42" y2="14" />
      <line x1="82" y1="28" x2="96" y2="14" />
      <line x1="82" y1="72" x2="96" y2="28" />
      <line x1="28" y1="72" x2="42" y2="28" />
    </g>
  )
}
