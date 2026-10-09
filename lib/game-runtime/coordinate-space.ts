export type LocalPoint = {
  x: number
  y: number
}

export type RectLike = Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>

export function toLocalPoint(
  clientPoint: LocalPoint,
  containerRect: RectLike,
): LocalPoint {
  return {
    x: clientPoint.x - containerRect.left,
    y: clientPoint.y - containerRect.top,
  }
}

export function getRectCenter(rect: RectLike, containerRect: RectLike): LocalPoint {
  return {
    x: rect.left - containerRect.left + rect.width / 2,
    y: rect.top - containerRect.top + rect.height / 2,
  }
}
