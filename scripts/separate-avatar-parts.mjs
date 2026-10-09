import * as T from 'three'

// Reconstructed hands, clothing and legs touch in the source surface. Give each
// volume its own vertices and close its boundary before it is animated.
export function separateAvatarParts(geometry, bones, outfit) {
  const source = geometry.attributes.position, joints = geometry.attributes.skinIndex, weights = geometry.attributes.skinWeight
  const arm = (name) => /^(Arm|Elbow|Hand)[LR]$/.test(name)
  const leg = (name) => /^(Thigh|Knee|Foot)[LR]$/.test(name)
  const family = (name) => arm(name) ? `Arm${name.at(-1)}` : leg(name) ? `Leg${name.at(-1)}`
    : name.startsWith('ClothBack') ? 'Back' : name.startsWith('Cloth') ? 'Front' : name === 'Accessory' ? name : 'Body'
  const fields = Array.from({length:source.count}, (_, i) => {
    const sums = {}
    for (let slot = 0; slot < 4; slot++) {
      const group = family(bones[joints.getComponent(i,slot)].name)
      sums[group] = (sums[group] ?? 0) + weights.getComponent(i,slot)
    }
    return sums
  })
  const position = [], skinIndex = [], skinWeight = [], indices = [], remap = new Map()
  const appendWeights = (influences) => {
    const ranked = [...influences].sort((a,b) => b[1] - a[1]).slice(0,4), sum = ranked.reduce((total,[,weight]) => total + weight,0)
    const bytes = ranked.map(([,weight]) => Math.round(weight / sum * 255)); bytes[0] += 255 - bytes.reduce((a,b) => a + b,0)
    for (let slot = 0; slot < 4; slot++) { skinIndex.push(ranked[slot]?.[0] ?? 0); skinWeight.push(bytes[slot] ?? 0) }
  }
  const capFan = (loop) => {
    const center = loop.reduce((sum,corner) => sum.add(new T.Vector3(...position.slice(corner * 3,corner * 3 + 3))),new T.Vector3()).multiplyScalar(1 / loop.length)
    const id = position.length / 3; center.toArray(position,position.length)
    const influences = new Map()
    for (const corner of loop) for (let slot = 0; slot < 4; slot++) {
      const bone = skinIndex[corner * 4 + slot], value = skinWeight[corner * 4 + slot]
      if (value) influences.set(bone,(influences.get(bone) ?? 0) + value)
    }
    appendWeights(influences)
    for (let i = 0; i < loop.length; i++) indices.push(loop[(i + 1) % loop.length],loop[i],id)
  }
  const vertex = (old, part) => {
    const x = source.getX(old), y = source.getY(old), z = source.getZ(old)
    const key = `${part}:${x.toFixed(6)}:${y.toFixed(6)}:${z.toFixed(6)}`
    if (remap.has(key)) return remap.get(key)
    const id = position.length / 3; remap.set(key,id); position.push(x,y,z)
    const influences = new Map()
    for (let slot = 0; slot < 4; slot++) {
      const bone = joints.getComponent(old,slot), name = bones[bone].name
      const allowed = family(name) === part || part.startsWith('Leg') && name === 'Hips'
      if (allowed && weights.getComponent(old,slot)) influences.set(bone,(influences.get(bone) ?? 0) + weights.getComponent(old,slot))
    }
    if (!influences.size) {
      const side = part.at(-1)
      const name = part.startsWith('Arm') ? `${y < 1.16 ? 'Hand' : y < 1.44 ? 'Elbow' : 'Arm'}${side}`
        : part.startsWith('Leg') ? `${y < .31 ? 'Foot' : y < .72 ? 'Knee' : 'Thigh'}${side}`
          : part === 'Front' ? 'ClothL' : part === 'Back' ? 'ClothBackL' : part === 'Accessory' ? part : 'Hips'
      influences.set(bones.findIndex(bone => bone.name === name),1)
    }
    appendWeights(influences)
    return id
  }
  const faces = []
  for (let i = 0; i < geometry.index.count; i += 3) {
    const corners = [0,1,2].map(c => geometry.index.getX(i + c)), sums = {}
    for (const id of corners) for (const [group,weight] of Object.entries(fields[id])) sums[group] = (sums[group] ?? 0) + weight / 3
    let part = Object.keys(sums).reduce((a,b) => sums[a] > sums[b] ? a : b)
    const y = corners.reduce((sum,id) => sum + source.getY(id),0) / 3
    if (outfit === 'hook' && !part.startsWith('Arm') && part !== 'Accessory' && y > .36 && y < 1.13) {
      if ((sums.Front ?? 0) > .3) part = 'Front'
      else if ((sums.Back ?? 0) > .3) part = 'Back'
    }
    faces.push({corners,part})
  }
  const neighbours = faces.map(() => []), shared = new Map()
  faces.forEach(({corners},face) => {
    for (let c = 0; c < 3; c++) {
      const a = corners[c], b = corners[(c + 1) % 3], key = `${Math.min(a,b)}:${Math.max(a,b)}`
      if (shared.has(key)) { const other = shared.get(key); neighbours[face].push(other); neighbours[other].push(face) }
      else shared.set(key,face)
    }
  })
  // Tiny ownership islands are usually paint/weight noise at a fused contact,
  // rather than a separate garment or piece of anatomy.
  const seen = new Set()
  faces.forEach((face,start) => {
    if (seen.has(start)) return
    const component = [start]; seen.add(start)
    for (let i = 0; i < component.length; i++) for (const next of neighbours[component[i]]) {
      if (!seen.has(next) && faces[next].part === face.part) { seen.add(next); component.push(next) }
    }
    if (component.length >= 12) return
    const surrounding = new Map()
    for (const id of component) for (const next of neighbours[id]) if (faces[next].part !== face.part) {
      const part = faces[next].part; surrounding.set(part,(surrounding.get(part) ?? 0) + 1)
    }
    const dominant = [...surrounding].sort((a,b) => b[1] - a[1])[0]?.[0]
    if (dominant) component.forEach(id => { faces[id].part = dominant })
  })
  for (const {corners,part} of faces) {
    const face = corners.map(old => vertex(old,part))
    const points = face.map(id => new T.Vector3(...position.slice(id * 3,id * 3 + 3)))
    const area = new T.Vector3().subVectors(points[1],points[0]).cross(new T.Vector3().subVectors(points[2],points[0])).lengthSq()
    if (new Set(face).size === 3 && area > 1e-18) indices.push(...face)
  }
  const boundary = new Map()
  for (let i = 0; i < indices.length; i += 3) for (let c = 0; c < 3; c++) {
    const a = indices[i + c], b = indices[i + (c + 1) % 3]
    if (boundary.has(`${b}:${a}`)) boundary.delete(`${b}:${a}`)
    else boundary.set(`${a}:${b}`,[a,b])
  }
  const exits = new Map()
  for (const [a,b] of boundary.values()) { const next = exits.get(a) ?? []; next.push(b); exits.set(a,next) }
  const remaining = new Map(boundary), loops = []
  while (remaining.size) {
    let current = remaining.values().next().value[0]
    const path = [], locations = new Map()
    while (true) {
      if (locations.has(current)) {
        const at = locations.get(current), loop = path.splice(at)
        loop.forEach(id => locations.delete(id)); if (loop.length > 2) loops.push(loop)
      }
      const next = exits.get(current)?.find(id => remaining.has(`${current}:${id}`))
      if (next === undefined) break
      locations.set(current,path.length); path.push(current)
      remaining.delete(`${current}:${next}`); current = next
    }
  }
  const beforeCaps = indices.length
  for (const loop of loops) {
    const points = loop.map(id => new T.Vector3(...position.slice(id * 3,id * 3 + 3))), normal = new T.Vector3()
    for (let i = 0; i < points.length; i++) normal.add(new T.Vector3().crossVectors(points[i],points[(i + 1) % points.length]))
    const axis = ['x','y','z'].sort((a,b) => Math.abs(normal[b]) - Math.abs(normal[a]))[0]
    const flat = points.map(p => new T.Vector2(axis === 'x' ? p.y : p.x,axis === 'z' ? p.y : p.z))
    const triangles = T.ShapeUtils.triangulateShape(flat,[]), capEdges = new Set()
    for (const triangle of triangles) for (let c = 0; c < 3; c++) {
      const a = triangle[c], b = triangle[(c + 1) % 3]; capEdges.add(`${Math.min(a,b)}:${Math.max(a,b)}`)
    }
    if (!loop.every((_,i) => capEdges.has(`${Math.min(i,(i + 1) % loop.length)}:${Math.max(i,(i + 1) % loop.length)}`))) {
      capFan(loop)
      continue
    }
    for (const triangle of triangles) {
      const [a,b,c] = triangle, cross = new T.Vector3().subVectors(points[b],points[a]).cross(new T.Vector3().subVectors(points[c],points[a]))
      indices.push(...(cross.dot(normal) > 0 ? [loop[a],loop[c],loop[b]] : [loop[a],loop[b],loop[c]]))
    }
  }
  const edgeCounts = () => {
    const edges = new Map()
    for (let i = 0; i < indices.length; i += 3) for (let c = 0; c < 3; c++) {
      const a = indices[i + c], b = indices[i + (c + 1) % 3], key = `${Math.min(a,b)}:${Math.max(a,b)}`
      edges.set(key,{a,b,count:(edges.get(key)?.count ?? 0) + 1})
    }
    return edges
  }
  // A few source faces have inconsistent winding. Recover those small loops
  // through their undirected boundary rather than leaving a hole in the cap.
  const unmatched = [...edgeCounts().values()].filter(edge => edge.count === 1), adjacent = new Map(), used = new Set()
  for (const {a,b} of unmatched) for (const [from,to] of [[a,b],[b,a]]) {
    const next = adjacent.get(from) ?? []; next.push(to); adjacent.set(from,next)
  }
  for (const {a,b} of unmatched) if (!used.has(a)) {
    const loop = [a]; let previous = a, current = b
    while (current !== a && !used.has(current)) {
      loop.push(current); used.add(current)
      const next = adjacent.get(current)?.find(id => id !== previous)
      if (next === undefined) break
      previous = current; current = next
    }
    used.add(a)
    if (current === a && loop.length > 2) capFan(loop)
  }
  // Thin non-manifold source plates can end at a single edge without a loop.
  // Give the incident face a small back and side walls, rather than leaving it
  // as an open sheet. This is only applied to the residual boundary faces.
  const residual = new Set([...edgeCounts()].filter(([,edge]) => edge.count === 1).map(([key]) => key))
  const originalLength = indices.length
  for (let i = 0; i < originalLength && residual.size; i += 3) {
    const face = indices.slice(i,i + 3), keys = face.map((a,c) => `${Math.min(a,face[(c + 1) % 3])}:${Math.max(a,face[(c + 1) % 3])}`)
    if (!keys.some(key => residual.has(key))) continue
    const points = face.map(id => new T.Vector3(...position.slice(id * 3,id * 3 + 3)))
    const normal = new T.Vector3().subVectors(points[1],points[0]).cross(new T.Vector3().subVectors(points[2],points[0])).normalize()
    const back = face.map((old,c) => {
      const id = position.length / 3; points[c].addScaledVector(normal,-.0005).toArray(position,position.length)
      skinIndex.push(...skinIndex.slice(old * 4,old * 4 + 4)); skinWeight.push(...skinWeight.slice(old * 4,old * 4 + 4)); return id
    })
    indices.push(back[2],back[1],back[0])
    for (let c = 0; c < 3; c++) {
      const next = (c + 1) % 3; indices.push(face[next],face[c],back[c],face[next],back[c],back[next])
    }
    keys.forEach(key => residual.delete(key))
  }
  const result = new T.BufferGeometry()
  result.setAttribute('position',new T.Float32BufferAttribute(position,3)); result.setIndex(indices)
  result.setAttribute('skinIndex',new T.Uint8BufferAttribute(skinIndex,4)); result.setAttribute('skinWeight',new T.Uint8BufferAttribute(skinWeight,4,true))
  result.computeVertexNormals()
  result.userData.partClosure = { capTriangles:(indices.length - beforeCaps) / 3, openEdges:[...edgeCounts().values()].filter(edge => edge.count === 1).length }
  return result
}
