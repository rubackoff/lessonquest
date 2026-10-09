import { Box3, Euler, Quaternion, SkinnedMesh, Vector3, type Object3D } from 'three'

export type AvatarActionPose = { kind: 'jump' | 'slide'; progress: number }
const poses = {
  jump: { Spine: -.08, ArmL: -.8, ArmR: -.8, ElbowL: -.65, ElbowR: -.65,
    ThighL: -.5, ThighR: -.25, KneeL: .9, KneeR: .55, FootL: -.3, FootR: -.2 },
  slide: { Hips: 1.1, Spine: 0, Head: 0, ArmL: -.4, ArmR: -.4, ElbowL: -1.1, ElbowR: -1.1, Accessory: -2.25,
    ThighL: -2.6, ThighR: -2.6, KneeL: 2.25, KneeR: 2.25, FootL: -.75, FootR: -.75,
    ClothL: -2.6, ClothR: -2.6, ClothBackL: -1.8, ClothBackR: -1.8 },
}
const targets = Object.fromEntries(Object.entries(poses).map(([kind, angles]) => [kind,
  Object.entries(angles).map(([name, angle]) => [name, new Quaternion().setFromEuler(new Euler(angle, 0, 0))] as const),
]))

/** Restore the sampled animation before layering, including frozen/pause frames. */
export function createAvatarActionLayer(model: Object3D) {
  const bones = [...new Set(Object.values(targets).flatMap(values => values.map(([name]) => name)))].flatMap(name => {
    const bone = model.getObjectByName(name)
    return bone ? [{ bone, rotation: bone.quaternion.clone(), position: bone.position.clone() }] : []
  })
  const hips = model.getObjectByName('Hips')
  const accessory = model.getObjectByName('Accessory'), modelY = model.position.y
  const skin = model.getObjectByProperty('isSkinnedMesh', true)
  let applied = false
  const floorBox = new Box3(), origin = new Vector3()
  return {
    restore() {
      if (!applied) return
      for (const { bone, rotation, position } of bones) { bone.quaternion.copy(rotation); bone.position.copy(position) }
      model.position.y = modelY
      applied = false
    },
    apply(pose: AvatarActionPose) {
      for (const value of bones) { value.rotation.copy(value.bone.quaternion); value.position.copy(value.bone.position) }
      const blend = Math.min(1, Math.max(0, pose.progress) / .12, Math.max(0, 1 - pose.progress) / .12)
      for (const [name, rotation] of targets[pose.kind]) model.getObjectByName(name)?.quaternion.slerp(rotation, blend)
      if (hips && pose.kind === 'slide') hips.position.y -= .62 * blend
      if (accessory && pose.kind === 'slide') { accessory.position.y += .1 * blend; accessory.position.z -= .34 * blend }
      if (pose.kind === 'slide' && skin instanceof SkinnedMesh) {
        model.parent!.updateMatrixWorld(true); skin.skeleton.update()
        skin.computeBoundingBox()
        floorBox.copy(skin.boundingBox!).applyMatrix4(skin.matrixWorld)
        model.position.y -= floorBox.min.y - model.parent!.getWorldPosition(origin).y
      }
      applied = true
    },
  }
}
