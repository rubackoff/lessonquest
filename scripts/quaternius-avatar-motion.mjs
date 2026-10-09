// Offline retargeting only. The browser receives our compact GLBs, not the source library.
import * as T from 'three'
import { readFileSync } from 'node:fs'

const directory = new URL('../assets/avatars/quaternius-ual-standard/', import.meta.url)
const gltf = JSON.parse(readFileSync(new URL('AnimationLibrary_Godot_Standard.gltf', directory), 'utf8'))
const binary = readFileSync(new URL('AnimationLibrary_Godot_Standard.bin', directory))
const source = new T.Group()
const nodes = gltf.nodes.map((data) => {
  const bone = new T.Bone()
  bone.name = data.name
  if (data.translation) bone.position.fromArray(data.translation)
  if (data.rotation) bone.quaternion.fromArray(data.rotation)
  if (data.scale) bone.scale.fromArray(data.scale)
  return bone
})
gltf.nodes.forEach((data, index) => data.children?.forEach((child) => nodes[index].add(nodes[child])))
nodes.filter((node) => !node.parent).forEach((node) => source.add(node))
source.updateMatrixWorld(true)
const rest = new Map(nodes.map((node) => [node.name, {
  position: node.getWorldPosition(new T.Vector3()), rotation: node.getWorldQuaternion(new T.Quaternion()),
}]))
const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }
function accessor(index) {
  const data = gltf.accessors[index], view = gltf.bufferViews[data.bufferView]
  const start = (view.byteOffset ?? 0) + (data.byteOffset ?? 0)
  return Array.from({ length: data.count * size[data.type] }, (_, i) => binary.readFloatLE(start + i * 4))
}
const clips = new Map(gltf.animations.filter((clip) => ['Idle_Loop', 'Jog_Fwd_Loop'].includes(clip.name)).map((clip) => {
  const tracks = clip.channels.map((channel) => {
    const sampler = clip.samplers[channel.sampler]
    const property = { rotation: 'quaternion', translation: 'position', scale: 'scale' }[channel.target.path]
    const Track = property === 'quaternion' ? T.QuaternionKeyframeTrack : T.VectorKeyframeTrack
    return new Track(`${nodes[channel.target.node].uuid}.${property}`, accessor(sampler.input), accessor(sampler.output))
  })
  return [clip.name, new T.AnimationClip(clip.name, -1, tracks)]
}))
const mapping = {
  Hips: ['DEF-hips', 'DEF-spine.001'], Spine: ['DEF-spine.002', 'DEF-spine.003'], Head: ['DEF-head', null],
  // Our L/R names designate negative/positive X; Blender uses anatomical left/right.
  ArmL: ['DEF-upper_arm.R', 'DEF-forearm.R'], ArmR: ['DEF-upper_arm.L', 'DEF-forearm.L'],
  ElbowL: ['DEF-forearm.R', 'DEF-hand.R'], ElbowR: ['DEF-forearm.L', 'DEF-hand.L'],
  HandL: ['DEF-hand.R', null], HandR: ['DEF-hand.L', null],
  ThighL: ['DEF-thigh.R', 'DEF-shin.R'], ThighR: ['DEF-thigh.L', 'DEF-shin.L'],
  KneeL: ['DEF-shin.R', 'DEF-foot.R'], KneeR: ['DEF-shin.L', 'DEF-foot.L'],
  FootL: ['DEF-foot.R', 'DEF-toe.R'], FootR: ['DEF-foot.L', 'DEF-toe.L'],
}

function sourcePose(name, time = 0) {
  const mixer = new T.AnimationMixer(source)
  mixer.clipAction(clips.get(name)).play()
  mixer.setTime(time)
  source.updateMatrixWorld(true)
  const pose = new Map(nodes.map((node) => [node.name, {
    position: node.getWorldPosition(new T.Vector3()), rotation: node.getWorldQuaternion(new T.Quaternion()),
  }]))
  mixer.stopAllAction()
  mixer.uncacheRoot(source)
  return pose
}

export function retargetAvatarMotion(scene, bones, continuousApron = false) {
  const target = new Map(bones.map((bone) => [bone.name, bone]))
  const targetRest = new Map(bones.map((bone) => [bone.name, bone.position.clone()]))
  const mesh = scene.getObjectByProperty('isSkinnedMesh', true)
  mesh.geometry.computeBoundingBox()
  const soleLimit = mesh.geometry.boundingBox.min.y + .018
  const soles = new Map()
  for (const side of ['L', 'R']) {
    const foot = target.get(`Foot${side}`), id = mesh.skeleton.bones.indexOf(foot)
    const inverse = foot.matrixWorld.clone().invert(), points = []
    const { position, skinIndex, skinWeight } = mesh.geometry.attributes
    for (let i = 0; i < position.count; i++) if (position.getY(i) < soleLimit && skinIndex.getX(i) === id && skinWeight.getX(i) > .95) {
      points.push(new T.Vector3().fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse))
    }
    if (!points.length) throw new Error(`Missing fully weighted sole vertices for Foot${side}`)
    soles.set(side, points)
  }
  const alignments = new Map(Object.entries(mapping).map(([name, [from, child]]) => {
    let direction = new T.Vector3(0, 1, 0)
    if (name.startsWith('Arm')) direction.copy(target.get(name.replace('Arm', 'Elbow')).position)
    if (name.startsWith('Elbow')) direction.copy(target.get(name.replace('Elbow', 'Hand')).position)
    if (/Thigh/.test(name)) direction.copy(target.get(name.replace('Thigh', 'Knee')).position)
    if (/Knee/.test(name)) direction.copy(target.get(name.replace('Knee', 'Foot')).position)
    if (/Foot/.test(name)) direction.set(0, 0, 1)
    // The toe joint sits below the ankle even in the bind pose; aligning that
    // vector to +Z would incorrectly tip an otherwise flat shoe forward.
    const alignment = child && !name.startsWith('Foot') ? new T.Quaternion().setFromUnitVectors(
      rest.get(child).position.clone().sub(rest.get(from).position).normalize(), direction.normalize(),
    ) : new T.Quaternion()
    return [name, alignment.invert()]
  }))
  const sourceScale = .90 / rest.get('DEF-thigh.L').position.clone().sub(rest.get('DEF-foot.L').position).length()
  const hipY = targetRest.get('Hips').y
  const standing = sourcePose('Idle_Loop',0)
  const standingWorld = new Map(Object.entries(mapping).map(([joint,[from]]) => [joint,
    standing.get(from).rotation.clone().multiply(rest.get(from).rotation.clone().invert()).multiply(alignments.get(joint)),
  ]))
  return [['Idle', 'Idle_Loop'], ['Run', 'Jog_Fwd_Loop']].map(([name, sourceName]) => {
    const duration = clips.get(sourceName).duration
    const count = Math.ceil(duration * 30)
    const times = Array.from({ length: count + 1 }, (_, i) => i * duration / count)
    const poses = times.map((time, i) => sourcePose(sourceName, i === count ? 0 : time))
    const sourceFloor = Math.min(...poses.map((pose) => Math.min(pose.get('DEF-foot.L').position.y, pose.get('DEF-foot.R').position.y)))
    const values = new Map([...Object.keys(mapping), 'ClothL', 'ClothR', 'ClothBackL', 'ClothBackR', 'Accessory'].map((joint) => [joint, []]))
    const hips = []
    poses.forEach((pose, i) => {
      const worldRotations = new Map([['Root', new T.Quaternion()]])
      for (const bone of bones) {
        const entry = mapping[bone.name]
        if (!entry) continue
        const [from] = entry
        const world = pose.get(from).rotation.clone().multiply(rest.get(from).rotation.clone().invert()).multiply(alignments.get(bone.name))
        if (name === 'Run' && !bone.name.startsWith('Foot')) {
          const amount = /^(Thigh|Knee)/.test(bone.name) ? .62 : /^(Arm|Elbow|Hand)/.test(bone.name) ? .72 : .80
          world.copy(standingWorld.get(bone.name).clone().slerp(world,amount))
        }
        const parentWorld = worldRotations.get(bone.parent.name) ?? new T.Quaternion()
        bone.quaternion.copy(parentWorld.clone().invert().multiply(world))
        // Avoid finger-axis twist on our stylized mitten hands.
        if (bone.name.startsWith('Hand')) bone.quaternion.identity()
        worldRotations.set(bone.name, parentWorld.clone().multiply(bone.quaternion))
        bone.quaternion.toArray(values.get(bone.name), i * 4)
      }
      const phase = i / count * Math.PI * 2
      const thighs = ['L', 'R'].map((side) => new T.Euler().setFromQuaternion(target.get(`Thigh${side}`).quaternion).x)
      for (const side of ['L', 'R']) {
        const offset = continuousApron || side === 'L' ? 0 : Math.PI
        const thigh = new T.Euler().setFromQuaternion(target.get(`Thigh${side}`).quaternion).x
        const flutter = (name === 'Run' ? .03 : .01) * Math.sin(phase + offset)
        // Idle also lifts a thigh: both poses must push the apron outside the leg.
        const frontThigh = continuousApron ? Math.min(...thighs) : thigh
        const backThigh = continuousApron ? Math.max(...thighs) : thigh
        const cloth = new T.Quaternion().setFromEuler(new T.Euler(-.07 + Math.min(0, frontThigh) * .90 + flutter, 0, 0))
        cloth.toArray(values.get(`Cloth${side}`), i * 4)
        new T.Quaternion().setFromEuler(new T.Euler(.07 + Math.max(0, backThigh) * .90 - flutter, 0, 0)).toArray(values.get(`ClothBack${side}`), i * 4)
      }
      new T.Quaternion().setFromEuler(new T.Euler(name === 'Run' ? .10 * Math.sin(phase - .45) : .015 * Math.sin(phase), 0, name === 'Run' ? .055 * Math.cos(phase) : 0)).toArray(values.get('Accessory'), i * 4)
      target.get('Hips').position.set(0, hipY, 0)
      scene.updateMatrixWorld(true)
      let minimum = Infinity
      for (const side of ['L', 'R']) {
        const foot = target.get(`Foot${side}`)
        for (const sole of soles.get(side)) {
          const point = sole.clone().applyMatrix4(foot.matrixWorld)
          minimum = Math.min(minimum, point.y)
        }
      }
      const air = name === 'Run' ? Math.max(0, Math.min(pose.get('DEF-foot.L').position.y, pose.get('DEF-foot.R').position.y) - sourceFloor) * sourceScale * .18 : 0
      // Leave clearance for interpolation between the sampled foot rotations.
      hips.push(0, hipY - minimum + air + .014, 0)
    })
    const tracks = [...values].map(([joint, data]) => new T.QuaternionKeyframeTrack(`${joint}.quaternion`, times, data))
    tracks.push(new T.VectorKeyframeTrack('Hips.position', times, hips))
    for (const side of ['L', 'R']) tracks.push(new T.VectorKeyframeTrack(`Eye${side}.scale`, [0, duration * .78, duration * .797, duration * .82, duration], [1, 1, 1, 1, 1, 1, 1, .10, 1, 1, 1, 1, 1, 1, 1]))
    bones.forEach((bone) => { bone.position.copy(targetRest.get(bone.name)); bone.quaternion.identity() })
    scene.updateMatrixWorld(true)
    return new T.AnimationClip(name, duration, tracks)
  })
}
