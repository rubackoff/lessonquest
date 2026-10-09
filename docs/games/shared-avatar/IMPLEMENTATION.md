# General character - models based on v5 reference

Date: 2026-10-06. Working files: three real skinned GLB's `public/game-assets/avatars/`. Approved drawing: [three-skins-v5.png](three-skins-v5.png).

## Changes

Instead of procedural blocks, volumetric surfaces were used, restored separately for all three costumes. “Hoodie” received folds of turquoise clothing, cargo, sneakers and a backpack; "Hook" - green hair, smile, quilted sleeves, asymmetrical shoulder pads, patch, chain and hook; “Phantom” - a sculptural mask, headset, scarf, vest, pouches, knee pads and backpack.

All three retain the same hierarchy and bind pose of 23 bones, Idle/Run names and the same file paths. The drawing is not used in place of the game character: the camera can go around the models, and the vertices move with the skeleton.

The final edit removes the excessive roundness of the entire figure: larger polygons and flat normals form edges on the hair, shoulders, sleeves, torso, pants and shoes. The top of the silhouette is slightly elongated, the head and waist are narrowed. The matte PBR material illuminates these edges in-game. User-approved motion keys are saved unchanged.

The shape of the heads has been returned to the accepted body assembly; the same relief of faces, hair and masks has been preserved. The height above the neck has been slightly reduced by 4% from the 1.98 point in model space. The width and depth of the heads, the positions of the remaining vertices, the development, textures, skeleton and movement keys coincide with the accepted body assembly.

## Reproducible build

```sh
node scripts/build-reference-v5-avatars.mjs
```

The team replaces three GLBs and `blocky-provenance.json` in `public/game-assets/avatars/`. For a separate check: `node scripts/build-reference-v5-avatars.mjs --candidate`; GLB, JPEG atlases and `provenance.json` will fall into `output/avatar-reference-v5/`. This mode does not replace game files and atlases of the accepted build.

1. Validated v5 converted to neutral front/rear technical views via built-in Image Gen. Prompts and images are saved in `assets/avatars/reference-v5/`.
2. For the three frontal views, separate white surfaces were obtained in the official public Hunyuan3D-2.1. The original GLB and parameters are saved locally; reassembly does not access the service. The missing Hoodie backpack has been added with local geometry.
3. Real white models are rendered orthographically. Image Gen colored these views while preserving their pose/silhouette. These are coloring inputs, not screenshots of the finished game.
4. Meshoptimizer reduces the original surface to 6 thousand triangles, leaving a margin for closing the cuts. `separate-avatar-parts.mjs` divides arms, legs, torso, apron and metal into closed volumes with their own vertices and bone influences. The borders are closed before development and coloring; small islands of erroneous purpose are attached to the neighboring part. The central part of the pelvis follows the Hips with a smooth transition to the hips. For Hook, the initial weights are smoothed by surface connectivity in 400 passes; the metal of the hook and chain is firmly tied to the Accessory. Peaks have up to four influences. The final surface of each suit remains within 7 thousand triangles.
5. Front/back/side coloring is mixed according to surface normals and recorded in xatlas scan: one built-in JPEG 1024x1024 per suit. The white background is removed from the border of the image, preserving the teeth and light details of clothing. After coloring, the proportions of the top are refined, and the vertices are divided into polygons for flat normals. Normals are stored as normalized Int16; One matte PBR material replaces the former unlit, so the edges respond to real lighting.
6. Idle/Run were previously moved offline from the Quaternius pinned CC0 library. For compact running, rotation of the hips/knees is mixed with the stance with a coefficient of 0.62, arms - 0.72, pelvis/torso/head - 0.80. The orientation of the feet is preserved from the original clip; the vertical flight phase is reduced to 0.18 from the original. The height of the pelvis was adjusted to the actual tops of the soles. User-approved results are saved in `assets/avatars/reference-v5/approved-motion.json`; The current build uses these unchanged keys, and tests check the contact of the new models with the floor. The front/back parts of the Hook apron move in coordination with the corresponding hip.

| Suit | Triangles | Peaks | Size GLB | Materials | Bones |
|---|---:|---:|---:|---:|---:|
| Hoodie | 6,284 | 18,852 | 947,440 bytes | 1 | 23 |
| Hook | 6,486 | 19,458 | 1,032,240 bytes | 1 | 23 |
| Phantom | 6,388 | 19,164 | 978,132 bytes | 1 | 23 |

GLBs contain texture and animations. Raw Hunyuan surfaces and Quaternius library are not loaded by the browser. Checksums for exports, textures and source surfaces are in provenance. Procedural assembly `build-blocky-avatars.mjs` saved as previous version; the current game files are created by a new team.

## Connecting to games

`lib/avatar/profile.ts` specifies the directory; `use-local-avatar.ts` saves selection; `avatar.ts` loads GLB and creates independent actors; `preview.ts` renders a fitting room. Cabinet `/profile` and the labyrinth `/lab/space-maze` use the same profile and the same files.

```ts
const definition = playerAvatarDefinition(profile, 1.05)
const asset = await loadAvatar(definition)
const actor = createAvatar(asset, definition)
scene.add(actor.root)
actor.root.position.copy(playerPosition)
actor.update(deltaSeconds, isMoving, facingAngle, worldSpeed)
```

The game masters world position, collisions and camera. Each actor has an independent skeleton and AnimationMixer. The Idle/Run transition is smooth, the pace follows the speed of movement; rotation selects a short arc. The old local skin IDs are migrated to the three current ones.

## Validation and Boundaries

`npm test`: 22 files, 170 tests. It is the supplied GLBs that are checked: general rig, normalized weights, UVs, embedded JPEGs, hashes, instance independence, final animation key values, clip closure, fixed Root, motion boundaries and 60-phase sole contact. Separate regressions test three-point hook stiffness and short surface edge elongation over 24 running phases for all three models.

The new checks only weld duplicate UVs with the same positions and weights: each suit has zero exposed edges. The absence of common arm/leg and apron/leg influences is checked, and the hip deviation from the stance in the full Run cycle is limited to 66 degrees. The division of volumes changes the geometry and development, so JPEG atlases are reassembled from the same approved colored views. GLB budget increased from 1.0 to 1.1 MB for additional covering surfaces without reducing texture quality.

After the round shape is edited, separate checks compare all Idle/Run keys to the saved approved motion and check for flat normals of each face, matte material, and a budget of less than 7 thousand triangles. Edges are checked against all source polygons; the same positions and weights, duplicated for flat normals, are calculated once per phase.

After replacing the game files, all 170 tests, linter and type checking passed. A browser run tested all three costumes from front/side/back, starting and stopping the run, saving after reboot, matching the costume in the maze, moving/pausing/restarting, fitting room, level 10 and light graphics. With a window size of 390x844, no horizontal overflow and touch control are checked. No JavaScript errors were reported. The interface code has not changed; a new production build was not required to replace the GLB.

Catalogs `qa-reference-v5/` and `qa-motion-v5/` show previous iterations of reconstruction and smoothing of weights, before the separation of closed volumes. Pictures `qa-v5/` refer to old procedural geometry. These archives are not proof of current running.

The coloring contains painted shadows of the surfaces; Matte PBR now also reacts to game lighting, so the look changes between scenes. The side surfaces use a mixture of four projections; distortions of the design remain on strong folds of the apron and bracers. Proportions and small details differ from the concept; a 1-to-1 artistic match is not stated. Mobile window emulation does not replace FPS/memory measurement on physical Android.

## Sources

Animations Quaternius - CC0-1.0; attached files, license and source are in `assets/avatars/quaternius-ual-standard/`. Hunyuan3D-2.1 has a separate Community License; You cannot designate the entire set as CC0. Full information about source images, generation and license: `assets/avatars/reference-v5/README.md`; a copy of the license is saved along with the original surfaces.


