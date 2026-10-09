import { AnimationMixer, Box3, Group, MathUtils, Mesh, MeshStandardMaterial, SkinnedMesh, Vector3, type AnimationAction, type Material } from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { avatarSkins, type AvatarProfile } from './profile'
import { createAvatarActionLayer, type AvatarActionPose } from './action-pose'

export type AvatarDefinition = {
  id: string
  source: string
  height: number
  idleClip: string
  runClip: string
  /** Nominal locomotion speed in the consumer's world units per second. */
  runSpeed?: number
  palette?: Readonly<Record<string, string>>
}

export const characterDefinition: AvatarDefinition = {
  id: 'shared-avatar-v5', source: '/game-assets/avatars/blocky-hoodie.glb', height: 1.05,
  idleClip: 'Idle', runClip: 'Run',
}

/** Games share appearance and animation, but own their position and collisions. */
export function playerAvatarDefinition(profile: AvatarProfile, height = characterDefinition.height): AvatarDefinition {
  const skin = avatarSkins.find((item) => item.id === profile.skinId)!
  return { ...characterDefinition, source: skin.source, height, runSpeed: height * 2.4 }
}

export async function loadAvatar(definition: AvatarDefinition): Promise<GLTF> {
  return new GLTFLoader().loadAsync(definition.source)
}

/** Shared actor presentation; no maze, questions, inventory or user identity here. */
export function createAvatar(asset: GLTF, definition: AvatarDefinition) {
  const root = new Group()
  const model = clone(asset.scene)
  const ownedMaterials: Material[] = []
  model.traverse((object) => {
    if (/pistol|weapon/i.test(object.name)) object.visible = false
    if (object instanceof Mesh) {
      object.castShadow = true
      object.receiveShadow = true
      if (definition.palette) {
        const recolor = (original: Material) => {
          const material = original.clone()
          if (material instanceof MeshStandardMaterial && definition.palette?.[material.name]) {
            material.color.set(definition.palette[material.name])
            material.roughness = 0.65
          }
          ownedMaterials.push(material)
          return material
        }
        object.material = Array.isArray(object.material) ? object.material.map(recolor) : recolor(object.material)
      }
    }
  })
  root.add(model)
  const mixer = new AnimationMixer(model)
  const clip = (name: string) => asset.animations.find((item) => item.name.split('|').pop() === name)
  const idle = clip(definition.idleClip)
  const run = clip(definition.runClip)
  const idleAction = idle ? mixer.clipAction(idle) : null
  const runAction = run ? mixer.clipAction(run) : idleAction
  let action: AnimationAction | null = idleAction
  action?.play()
  // glTF bone matrices must be current before measuring a skinned character.
  mixer.update(0)
  model.updateMatrixWorld(true)
  model.traverse((object) => {
    if (object instanceof SkinnedMesh) { object.skeleton.update(); object.computeBoundingBox(); object.computeBoundingSphere() }
  })
  const box = new Box3().setFromObject(model)
  const scale = definition.height / box.getSize(new Vector3()).y
  model.scale.multiplyScalar(scale)
  model.position.y -= box.min.y * scale
  let moving = false
  let pace = 0
  let lean = 0
  const spine = model.getObjectByName('Spine')
  const actionPose = createAvatarActionLayer(model)

  return {
    root,
    update(delta: number, isMoving: boolean, angle: number, movementSpeed = definition.runSpeed ?? definition.height * 2.4, pose?: AvatarActionPose) {
      actionPose.restore()
      if (spine) spine.rotateZ(-lean)
      if (moving !== isMoving) {
        moving = isMoving
        const next = isMoving ? runAction : idleAction
        if (next !== action) {
          action?.fadeOut(0.18)
          // Preserve stride phase across tile boundaries and brief direction changes.
          if (next) {
            // A completed fade-out disables the action; play() alone leaves it frozen.
            next.enabled = true
            next.paused = false
            next.setEffectiveWeight(1).fadeIn(0.18).play()
          }
          action = next
        }
      }
      const difference = MathUtils.euclideanModulo(angle - root.rotation.y + Math.PI, Math.PI * 2) - Math.PI
      root.rotation.y += difference * (1 - Math.exp(-delta * 18))
      const rate = movementSpeed / (definition.runSpeed ?? definition.height * 2.4)
      pace = MathUtils.damp(pace, isMoving ? MathUtils.clamp(rate * .8, 0, 1.35) : 0, 14, delta)
      runAction?.setEffectiveTimeScale(pace)
      mixer.update(delta)
      // Bank only the upper body; feet and collision position stay on the floor.
      lean = MathUtils.damp(lean, isMoving ? MathUtils.clamp(difference * -0.075, -0.085, 0.085) : 0, 12, delta)
      if (spine) spine.rotateZ(lean)
      if (pose) actionPose.apply(pose)
    },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(model); ownedMaterials.forEach((material) => material.dispose()) },
  }
}
