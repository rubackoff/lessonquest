# General character: requirements for a 3D model

Update 2026-10-06: The direction below is historical. The user chose a geometric Roblox-like design and three v5 costumes: “Hoodie”, “Hook”, “Phantom”. Current files, general contract and artistic restrictions - [../shared-avatar/IMPLEMENTATION.md](../shared-avatar/IMPLEMENTATION.md). Old assets and experiments have been preserved; the current directory does not use them. Artistic acceptance is still not replaced by technical tests.

Date: 2026-10-04. Status: functional integration exists, artistic acceptance has NOT been passed. The user clearly demanded the quality of the approved reference, without simplification. Procedural models from `scripts/build-casual-avatars.mjs` — technical preparation only, not final delivery.

## Current Shape Recovery Experiment

- Front and rear A-pose references were created for the hoodie: `avatar-hoodie-apose-v4.png`, `avatar-hoodie-back-v4.png` (ImageGen, based on an approved image).
- Geometry obtained via public shape-generation demo of Tencent Hunyuan3D-2.1; source saved in `assets/avatars/source/hoodie-hunyuan-shape.glb`. The license terms of the model and results must be verified before public release.
- `node scripts/build-reference-avatar.mjs` collects experimental `public/game-assets/avatars/reference-hoodie.glb`: 60,000 triangles, about 2.21 MB, general skeleton and Idle/Run. This version of the hoodie is temporarily connected in the office; The jacket remains a procedural blank for now.
- The visual defect is confirmed: color transfer causes stains on the sides and shoes. A diagnostic render without color showed a clean surface; Disabling self-shadowing did not solve the problem. Diagnostic bootloader changes have been cancelled.
- Full texture generation in the demo is not available without a paid plan; paid operations were not performed. The current local projection does not replace high-quality texture mapping.
- Next required work: clean paint/UV, warp check, second set of same art strip, comparison of both real renders with reference. You cannot declare the same quality or readiness of both skins.
- Android optimization should keep the appearance at game size; The number of polygons in itself is not a criterion for artistic acceptance.

## Approved direction

- Character: `avatar-outfits-v3.png`. A man with simplified playing proportions, an open face, large hands and sneakers. Not an astronaut or a blocky Roblox avatar.
- Two sets: turquoise hoodie / dark trousers / white and turquoise shoes; light terracotta jacket / sand trousers / light shoes.
- The face, hair, body and proportions are the same. Clothing differs in geometry, not just color.
- Environment: `concept-light-casual-v3.png`, based on `concept-light-v1.png`. Do not use the greenhouse from V2.

## Minimum supply for current loader

1. Two self-contained GLBs: `casual-hoodie.glb` and `casual-jacket.glb`. They use the same skeleton and set of animations. This is the minimum volume; random assembly of clothes from objects is not yet required.
2. Embedded Clips `Idle` and `Run`, looped, movement in place without displacement of the root bone. Movement and rotation are controlled by game logic.
3. Vertical +Y, face at +Z, soles at Y=0. Same scale of two files. The loader normalizes the height: 1.05 in the maze and 2 in the office.
4. Standard glTF PBR materials. No external network textures, proprietary shaders, lights or cameras in the model. Matte fabrics, simple hair with readable large strands, no transparent hair cards.
5. Preliminary mobile budget: up to 20 thousand triangles, up to 6 materials and up to 3 MB per set; textures up to 1024 px. These are target restrictions, not the result of measurements on Android.
6. Identical names of bones and lack of intersection of clothes with the body in Idle and Run. Correct hands, two arms and two legs; no helmet, weapons or remaining suit parts.
7. Source model/rig and information about origin and license. Paid tools or asset purchases require separate approval.

## Connection

- `lib/avatar/space-avatar.ts`: generic character instead of astronautDefinition, keep generic AnimationMixer and smooth Idle/Run change. Enemies continue to use their GLB loader.
- `lib/avatar/profile.ts`: two sets of clothes instead of “Orbit” and “Mars”; Explicitly migrate existing local skinIds without losing saved selections.
- `components/games/space-maze/avatar-preview.ts` and `maze-view.ts`: One source of character definition for cabinet and game.
- `components/avatar-profile/avatar-profile-page.tsx` and `avatar-wardrobe.tsx`: names “Hoodie”/“Jacket”, remove texts about the astronaut; Don't promise a yet-to-be-implemented accessory editor.
- Do not change the maze generator, tasks, enemies and controls when replacing a character.

## Acceptance

- Compare real renders of both kits with `avatar-outfits-v3.png`: silhouette, face, hair, clothing geometry, palette.
- Check Idle → Run → Idle, smooth turn, absence of root motion and falling to the floor.
- Office → select a jacket → save → labyrinth → next level → reload; then repeat with the hoodie.
- Check mobile layouts and WebGL errors; Performance on physical Android is measured separately.
- Run tests, typecheck, lint and build. Until you receive the actual models, do not consider the visual replacement complete.

## Local production instead of external service

The model was made in software: profile clothing meshes, separate face and hair geometry, vertex weights and a general skeleton of 18 bones. These are real SkinnedMesh/GLB, not sprites or old astronaut. For export, the already installed Three.js is used; there are no paid requests or new external services.

The files are in `public/game-assets/avatars/`. `provenance.json` contains the exact size, number of triangles and SHA-256. Each image is about 1.15 MB and 31.5 thousand triangles, 12 materials, without textures and external downloads. The initial target of 20 thousand/6 materials has not yet been reached; this is not stated as measured performance on Android.

In the office you can view the run and turn the character by dragging. Old saved slots `explorer` and `pioneer` migrate to `hoodie` and `jacket`. New tests check weights, identical skeleton, GLB independence, animations, dimensions, checksums and loading with a real game loader.

There is a known difference from the reference: the face, strands of hair, cut and folds of clothing are simplified. The environment of the labyrinth is not redesigned by this change; the greenhouse concept has not been implemented. Do not consider the first model as the final artistic match to the reference.
