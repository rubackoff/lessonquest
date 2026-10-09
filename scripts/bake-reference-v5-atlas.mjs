import * as T from 'three'
import createXAtlas from 'xatlas-wasm'
import sharp from 'sharp'

const xatlasModule = createXAtlas()

// Bake overlapping camera paintings into one UV atlas. Blending by the surface
// normal avoids the hard projection changes produced by per-triangle tiles.
export async function bakeReferenceAtlas(source, views) {
  const xatlas = await xatlasModule, layout = xatlas.createAtlas()
  try {
    const error = layout.addMesh({ positions: source.attributes.position.array,
      normals: source.attributes.normal.array, indices: new Uint32Array(source.index.array) })
    if (error !== 0) throw new Error(`UV unwrap failed: ${xatlas.addMeshErrorString(error)}`)
    layout.generate({maxIterations:1}, {resolution:1024,padding:4,blockAlign:true})
    if (layout.atlasCount !== 1) throw new Error('Expected one avatar texture atlas')
    const mesh = layout.getMesh(0), geometry = new T.BufferGeometry(), size = 1024
    for (const [name, attribute] of Object.entries(source.attributes)) {
      const array = new attribute.array.constructor(mesh.vertexCount * attribute.itemSize)
      mesh.vertices.forEach((vertex, i) => array.set(attribute.array.subarray(vertex.xref * attribute.itemSize, (vertex.xref + 1) * attribute.itemSize), i * attribute.itemSize))
      geometry.setAttribute(name, new T.BufferAttribute(array, attribute.itemSize, attribute.normalized))
    }
    const coordinates = mesh.vertices.map((vertex) => [vertex.uv[0] / layout.width * size, vertex.uv[1] / layout.height * size])
    geometry.setAttribute('uv', new T.Uint16BufferAttribute(coordinates.flatMap(([u,v]) => [Math.round(u / size * 65535), Math.round(v / size * 65535)]), 2, true))
    geometry.setIndex(Array.from(mesh.indices))
    const pixels = Buffer.alloc(size * size * 3), filled = new Uint8Array(size * size)
    const position = geometry.attributes.position, normal = geometry.attributes.normal
    for (let triangle = 0; triangle < mesh.indexCount; triangle += 3) {
      const ids = Array.from(mesh.indices.subarray(triangle, triangle + 3))
      const [a,b,c] = ids.map((id) => coordinates[id])
      const determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
      if (Math.abs(determinant) < 1e-5) continue
      const lowX = Math.max(0, Math.floor(Math.min(a[0],b[0],c[0]))), highX = Math.min(size - 1, Math.ceil(Math.max(a[0],b[0],c[0])))
      const lowY = Math.max(0, Math.floor(Math.min(a[1],b[1],c[1]))), highY = Math.min(size - 1, Math.ceil(Math.max(a[1],b[1],c[1])))
      for (let y = lowY; y <= highY; y++) for (let x = lowX; x <= highX; x++) {
        const first = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / determinant
        const second = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / determinant
        const third = 1 - first - second
        if (Math.min(first,second,third) < -.001) continue
        const interpolate = (attribute, component) => attribute.array[ids[0] * 3 + component] * first
          + attribute.array[ids[1] * 3 + component] * second + attribute.array[ids[2] * 3 + component] * third
        const px = interpolate(position,0), py = interpolate(position,1), pz = interpolate(position,2)
        const nx = interpolate(normal,0), ny = interpolate(normal,1), nz = interpolate(normal,2)
        const weights = [Math.max(0,nz) ** 6, Math.max(0,-nz) ** 6, Math.max(0,-nx) ** 6, Math.max(0,nx) ** 6]
        // Top/bottom surfaces still need a stable painting when X/Z vanish.
        weights[pz < 0 ? 1 : 0] += Math.abs(ny) ** 6
        const sum = weights.reduce((total,value) => total + value,0), at = (y * size + x) * 3, blended = [0,0,0]
        for (let view = 0; view < 4; view++) if (weights[view] > 1e-8) {
          const colour = views[view].rgb(px,py,pz)
          for (let channel = 0; channel < 3; channel++) blended[channel] += colour[channel] * weights[view] / sum
        }
        for (let channel = 0; channel < 3; channel++) pixels[at + channel] = Math.min(255,Math.round(blended[channel]))
        filled[y * size + x] = 1
      }
    }
    // Extend chart colours into padding for bilinear filtering and mipmaps.
    const queue = new Int32Array(size * size), nearest = new Int32Array(size * size).fill(-1)
    let length = 0
    for (let i = 0; i < filled.length; i++) if (filled[i]) { queue[length++] = i; nearest[i] = i }
    for (let cursor = 0; cursor < length; cursor++) {
      const at = queue[cursor], x = at % size, y = Math.floor(at / size)
      for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nx = x + dx, ny = y + dy, next = ny * size + nx
        if (nx < 0 || nx >= size || ny < 0 || ny >= size || nearest[next] !== -1) continue
        nearest[next] = nearest[at]; queue[length++] = next
      }
    }
    for (let i = 0; i < filled.length; i++) if (!filled[i]) for (let channel = 0; channel < 3; channel++) pixels[i * 3 + channel] = pixels[nearest[i] * 3 + channel]
    const atlas = await sharp(pixels,{raw:{width:size,height:size,channels:3}}).jpeg({quality:80,chromaSubsampling:'4:2:0'}).toBuffer()
    return {geometry,atlas}
  } finally { layout.destroy() }
}
