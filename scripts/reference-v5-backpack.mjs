import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

// The single-view reconstruction missed the hoodie backpack shown in v5.
// Shared by the offline mesh exporter and its orthographic paint reference.
export function createHoodieBackpackGeometry() {
  const pieces = []
  for (const [size, position, radius] of [
    [[.50, .53, .19], [0, 1.425, -.318], .045],
    [[.426, .22, .054], [0, 1.32, -.427], .025],
    [[.136, .045, .067], [0, 1.699, -.324], .015],
  ]) {
    const geometry = mergeVertices(new RoundedBoxGeometry(...size, 2, radius))
    geometry.translate(...position); pieces.push(geometry)
  }
  for (const geometry of pieces) { geometry.deleteAttribute('normal'); geometry.deleteAttribute('uv') }
  return mergeGeometries(pieces)
}
