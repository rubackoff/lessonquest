# v5 reconstruction inputs

Approved design: `docs/games/shared-avatar/three-skins-v5.png`.

The neutral front/back sheets were generated with built-in Image Gen on 2026-10-06. They preserve the three costumes and change pose/camera for reconstruction. Exact prompts are saved alongside the sheets. Each sheet was split into three equal columns with Sharp. These crops are reconstruction inputs, not game sprites or implementation screenshots.

White geometry was generated separately for all three front crops with the official public Tencent Hunyuan3D-2.1 Space:

- https://huggingface.co/spaces/tencent/Hunyuan3D-2.1
- API: `shape_generation`; seed 1234, 30 inference steps, guidance 5, octree resolution 256, 8000 chunks, background removal enabled, random seed disabled.
- Original outputs: `assets/avatars/source/{hoodie,hook,phantom}-hunyuan-v5-shape.glb`. API result metadata: the three `*-generation.json` files here.
- Full `generation_all` returned an error. The successful calls used free public shape generation; no paid operation, subscription or account change was performed.

`unpainted-front.png`, `unpainted-back.png`, `unpainted-left.png` and `unpainted-right.png` are actual orthographic Three.js renders of those surfaces, normalized to height 2.6. The hoodie backpack was authored locally in `scripts/reference-v5-backpack.mjs` and included before rendering.

The four `painted-{front,back,left,right}-sheet.png` files were generated with built-in Image Gen from those actual white renders plus the approved colour references. The exact `painted-*.prompt.txt` files request colour-only edits preserving the actual surfaces. These sheets and the three crops per view are material inputs; they are not evidence of runtime rendering.

The offline builder bakes these four paintings into per-skin 1024x1024 xatlas UV charts, blending paintings by surface normal and padding chart borders, simplifies geometry and assigns the same 23-bone rig. The embedded JPEG (quality 80, 4:2:0) uses one matte PBR material with flat face normals, replacing the earlier unlit material. The larger polygon faces and refined upper silhouette reduce the rounded appearance of the whole figure. Int16 normalized normals keep exports compact. Actual vertices and triangles are skinned; these are volumetric models rather than billboards. Surface details at side transitions and strong bends remain an approximation of the reference.

The running repair separates fused hand/clothing/leg contacts into independently closed moving volumes before atlas baking. Each shipped mesh has zero open boundary edges after welding identical positions and skin weights across UV seams. Run uses a shorter thigh/arm swing and reduced vertical flight while retaining the source foot orientation and actual sole contact correction. The user-approved Idle/Run keys are saved in `approved-motion.json` and reused unchanged when refining geometry; the shipped-asset tests compare every key and check actual sole contact. The three GLBs remain below 7,000 triangles and 1.1 MB each; all 23 bone names and the shared bind pose remain unchanged.

Rebuild all three shipped GLBs with `node scripts/build-reference-v5-avatars.mjs`. This writes `public/game-assets/avatars/` and its provenance, and saves the atlas JPEGs here. `--candidate` writes GLBs, atlas JPEGs and provenance together in `output/avatar-reference-v5/`, leaving the shipped assets and their JPEGs intact. Both rebuild modes use saved inputs and require no live generation service.

The source model uses the Tencent Hunyuan3D-2.1 Community License, not CC0. Official license: https://huggingface.co/spaces/tencent/Hunyuan3D-2.1/blob/main/LICENSE; a copy is stored with the generated source meshes. Tencent claims no rights in generated outputs (section 6(d)); the agreement also restricts use/display of outputs outside its defined territory (section 5(c), excluding EU, UK, South Korea). These sources are used for local development in the user's workspace; website publication is outside this task.

Quaternius motion has its own CC0-1.0 license and pinned sources in `assets/avatars/quaternius-ual-standard/`. Do not label the entire reconstruction pipeline as CC0.

UV chart generation uses the MIT-licensed xatlas-wasm package only in the offline builder. API/source: https://github.com/mode777/xatlas-wasm. No WASM unwrapper is shipped to the browser.

