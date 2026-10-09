# General character and space labyrinth

Current cut 2026-10-06: a common character on Three.js, three GLB suits “Hoodie”, “Hook”, “Phantom”, an office and a labyrinth. Implementation and verification with approved v5: [games/shared-avatar/IMPLEMENTATION.md](games/shared-avatar/IMPLEMENTATION.md). The sections below preserve the history of the prototype; mentions of the astronaut and two old skins are not a current task.

Date: 2026-10-04. Status: the first local working prototype has been implemented; restrictions and verification - section 11.

## 1. Solution and boundaries

We create our own browser-based system of educational mini-games: content and templates as separate entities, a common character and progress between games. We take the Roblox principle of a portable avatar, but not its engine or other people's games.

The first result to be checked is `/lab/space-maze`: A human astronaut navigates a light maze, avoids aliens, and reaches a lighthouse with the correct answer. Ten levels differ in map and composition/behavior of opponents. The item is not included in the game scene.

We do not change existing Phaser games, editor, authorization and storage of materials. We are not currently building a store, multiplayer, open world or universal engine. The prototype does not show actual purchases and is not a secure rating system.

## 2. Architecture

### Layers

1. **Training content**: existing `QuizQuestion` - ID, text, options, correct index, explanation, optional image. The same question can be used by a quiz and a maze.
2. **Maze rules**: pure TypeScript, without React, DOM and Three.js. Map, movement along passages, pathfinding, collisions, attempts, lives, level states.
3. **3D-View**: Three.js displays the state of the rules. Doesn't decide whether the answer is correct; does not store purchases. Wall geometry and collisions come from the same map.
4. **Character**: GLB loading, idle/run skeletal animations, sizes and orientation. The character's configuration is separate from the state of the specific maze.
5. **React interface**: task, answer options, pause, selection of training set, results and on-screen controls. The text is HTML, not part of the image.
6. **Later - progress server**: lesson results, inventory, tutor assignments, issuing awards and checking rights to items.

Flow: training set → level → rules engine → snapshot for HUD and 3D → result of attempt. The UI sends motion/pause commands, but does not pass the rules to button handlers.

### First slice stack

- Existing Next.js / React / TypeScript: routing and UI.
- Three.js, loaded only on the 3D game page; WebGL2, orthographic camera.
- `GLTFLoader`, `SkeletonUtils.clone`, `AnimationMixer`: models and real skeletal animation.
- CSS Modules and existing Onest tokens/font: isolated styling.
- Vitest: map generation, response reachability, movement, damage, state transitions.
- Built-in browser: check actual rendering and interactions.

A separate physics engine is not needed: the map is discrete, movement is interpolated between neighboring cells, and collisions are simple. React Three Fiber is also optional for one small scene. We do not add layers unless absolutely necessary.

## 3. General essence of the character

Long-term model implemented in stages:

- `AvatarDefinition`: model, scale, animation names and future attachment points.
- `AvatarProfile`: format version, body ID, palette, equipped item IDs.
- `Inventory`: what objects belong to the student; not the same as equipment.
- `ActorState`: position, direction, current animation, temporary invulnerability. Lives only in the game session.

The prototype contains one person in a spacesuit, two skins of materials “Orbit” and “Mars”, a separate character creation/animation module. This is not yet a universal modular body and not a ready-made wardrobe.

According to the user: `/profile` — a local personal account with a real 3D preview, a choice of two skins, explicit saving and a link to the labyrinth. `lib/avatar/profile.ts` defines a versioned profile; `use-local-avatar.ts` saves it to localStorage. The account and the game use the same profile and `space-avatar.ts`, without copying game logic. The selection remains after rebooting and moving between levels. There is no authorization or synchronization between devices yet.

Next stage: single humanoid rig, same bone names, export scale/pose, limited family of bodies. Slots: head, back, right/left hand, suit. Rigid accessories are attached to the bones; The clothing uses a compatible skeleton. Covered body parts are hidden to avoid overlap. Without fabric simulation and automatic fit of any clothing on any body.

Item Contract: `id`, `slot`, `asset`, `compatibleBodies`, `hideBodyParts`, `unlockRule`. The server is the source of ownership. Client events themselves do not provide paid items.

## 4. Maze mechanics

### Cycle

1. Show the question and three beacons A/B/C with corresponding answers.
2. The player reads the task before the start: the enemies are motionless.
3. The player starts moving using arrows/WASD or on-screen buttons.
4. When entering the lighthouse, the answer is recorded.
5. Correct answer → explanation → next level.
6. Wrong answer → loss of life, explanation, repeat the level with the same question.
7. Contact with the enemy → loss of life, return to start, short invulnerability.
8. No lives → explicit replay screen; Levels completed in this attempt are not given as a new result.
9. After level 10 → summary: correct answers, errors, collisions, time; the opportunity to start again.

Training errors and collisions are counted separately: dexterity does not equal knowledge of the subject. There is no timer to make you read faster. Pause is always available; When you minimize the tab, the game stops.

### Management

- Keyboard: arrows and WASD, Space/Escape - pause.
- Phone: four large buttons ≥ 44 px, hold and single press.
- The direction changes at the centers of the cells; the rotation is buffered in advance for smoothness.
- Losing focus/cancelling a pointer event resets held keys.
- On a mobile portrait, the field fits the width, the HUD and buttons do not overlap the path.
- Maps and movement are independent of frame rate; limited simulation step after a long frame.

### Opponents

- **Scout**: patrol between points; introduction to evasion.
- **Hunter**: Follows the shortest path when the player is close enough.
- **Interceptor**: Selects a point ahead of the player's movement, does not teleport or go through walls.

They differ not only in color, but also in behavior/silhouette. The player's speed is higher than the normal speed of enemies. Spawns are removed from the player; after damage there is no chain of immediate repeated collisions.

### Ten levels

| Levels | Change | Check |
| --- | --- | --- |
| 1–2 | Small map, one slow scout | Understand Beacons and Control |
| 3–4 | More forks, hunter added | There are safe bypasses |
| 5–6 | Longer paths, two types of opponents | Opponents do not block the start |
| 7–8 | Interceptor added | Behavior readable, no instant attacks |
| 9–10 | Three opponents, the most difficult map | All answers are available, the player is faster than enemies |

Generation determined by seed level. First, a connected labyrinth is built, then bypass loops are added; Beacons are placed in different remote areas. Autotest checks the reachability of each beacon and the uniqueness of spawns on all ten maps.

## 5. Tutor items and materials

In the first prototype: mathematics and existing English/biology demo sets. This tests the independence of mechanics from the subject, but does not mean complete coverage of the curriculum.

Next step: editor adapter for any multiple choice question, including Russian, history, geography, computer science, physics, chemistry and other subjects. The tutor asks the correct answer, explanation and images of the task/options. No question texts are stored in the 3D models. Images are displayed in an HTML layer with the ability to zoom in and pause the game.

Validate before launch: 3 options for current beacon scheme, non-empty strings, correct index in range. Add support for a different number of responses along with adapting the map/UI, rather than silently cutting off the options.

## 6. Visual system

Direction: light orbital station, white panels, low chamfered walls, thin turquoise inserts, soft daylight. A human astronaut, not a hamster. Aliens are readable against the background of the floor. No dark green/blue hats.

- Main UI: `#FFFFFF`, background `#F5F7F8`, text `#18212D`.
- Accent: `#138B8F`; confirmation/continue buttons: `#15945B`.
- Onest: clear hierarchy of question, answers and service signatures.
- Thin dividers, minimum frames, calm radius of 10–16 px.
- The background of the environment can be a prepared picture; walls, characters and beacons are real geometry.
- The field does not rotate like a diamond: the screen arrows coincide with the direction of movement.
- Smooth running and turns; restrained feedback. With reduced-motion, optional swaying and shimmering are disabled, but not the main movement of the hero.

First concept: `docs/games/space-maze/concept-light-v1.png`. The concept is a guideline, not an interactive result and not a user-approved final design. We check the actual degree of compliance using a browser screenshot.

A conscious difference from the usual raster asset pipeline: the user requested Three.js and a portable character, so we use real GLB with skeletons, and not a generated sprite instead of 3D. The environment outside the playing field is a separate generated plate. Without someone else's UI, texts and Wordwall/Roblox models.

## 7. Productivity and Android

Target budgets, not yet measurement results:

- 30 FPS on selected budget Android, 60 FPS on more powerful devices.
- WebGL2-capable browsers only; in the absence of context, a clear message rather than a blank screen.
- Pixel ratio is limited; narrow screens have a lower ceiling.
- We reuse geometry/materials, combine walls/tiles through instancing.
- One main light, one small shadow map in normal mode; light mode without dynamic shadows.
- No bloom/SSAO/SSR/fabric physics, heavy particles, HDR environment and expensive transparent layers.
- We download only used GLBs, not the entire asset pack. We optimize the background in WebP.
- The UI is updated on significant events/with moderate frequency, not through React setState for each animation frame.
- When leaving the page: cancel the animation frame, remove listeners, free up GPU resources and mixers.

Before Android support is announced: physical phone, portrait/landscape, 3-5 minutes of play, test heat, FPS, memory, touch and recovery after minimizing. Window size emulation does not replace this.

## 8. Stages and criteria of readiness

### A. First game prototype - current task

- [x] Isolated route `/lab/space-maze` and a link from the application.
- [x] Bright visual concept and real licensed models.
- [x] Personal account `/profile`, two skins, saving and transferring to the labyrinth.
- [x] 10 deterministic reachable maps, three enemy behaviors.
- [x] Hero with skeletal idle/run, movement and collisions.
- [x] Questions, beacons, right/wrong answer, lives, results.
- [x] Pause, restart, keyboard and screen controls.
- [x] Unit tests, typecheck, build, browser check.
- [x] Screenshot of desktop and mobile interface; known limitations are listed honestly.

### B. Connection to educational product

Material editor → question adapter → template launch → existing session/result pipeline. Supports images and long questions. The tutor sees educational errors separately from game errors. Check: one material is reproduced in both the quiz and the maze without manual copying.

### C. Portable Avatar

Single rig + 5-10 compatible items + small fitting room + profile version. The second test scene reads the same profile. Check: the item is worn once and is correctly visible in two games, animations do not break.

### D. Achievements and homework

Server `assignment`, `attempt`, `learning_result`, `inventory_item`. Idempotent issuance of a reward based on a confirmed result; repeating a request does not duplicate the item. The tutor sets the material, the student follows the link, the tutor sees errors and attempts. Do not mix assessment of knowledge and dexterity.

### E. Additional Games

First, parkour with a choice of platforms and a training quest room. Each game accepts material and an avatar, returns attempts and the result. These are our own implementations of genres, not imports of Roblox games. In basic card templates, the character does not overlap the material; adult mode can hide it.

### F. Purchases - separately after checking the product

Cosmetics only, no influence on correct answers/scores. Server catalogs and rights, payment webhooks, idempotency, returns, purchase restoration, age/parental restrictions. No random paid rewards in MVP.

## 9. Main risks

1. Incompatible clothing/skeletons: Fix a single rig prior to wardrobe production.
2. A detailed reference may be more expensive than the target phone: the quality of the silhouette and light is more important than post-effects; reduce cost based on measurements.
3. Monsters interfere with learning: start after reading, pause, separate recording of learning errors, subsequent quiet mode.
4. The first GLB suit is not a one-size-fits-all body: don't promise modular clothing until Stage C.
5. Project bloat: don't build your own equivalent of Roblox Studio; make one portable contract and specific games.

## 10. Sources and licenses

- Roblox avatar architecture: https://create.roblox.com/docs/avatar
- Roblox Player installation: https://en.help.roblox.com/hc/en-us/articles/204473560-How-to-Install-and-Play-Roblox
- Three.js game-library scope: https://threejs.org/manual/en/game.html
- GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- Quaternius Ultimate Space Kit, author's page, CC0: https://quaternius.com/packs/ultimatespacekit.html
- Human Spaceman from the Ultimate Modular Men Pack, CC0: https://quaternius.com/packs/ultimatemodularcharacters.html ; GLB card: https://poly.pizza/m/3hC2i0CTuO
- GLB archive published on OpenGameArt: https://opengameart.org/content/ultimate-space-kit-by-quaternius
- Future modular wardrobe as a technical reference: https://quaternius.com/packs/modularcharacteroutfitsfantasy.html
- Wordwall, material/template/topic division: https://wordwall.net/features

For the models used, we save the file names, source, license and checksums next to the assets. Generated concept/plate - individual artifacts; We do not pass them off as screenshots of a working application.

## 11. Implemented slice and check

### Entry points and files

- `http://localhost:3000/profile` - personal account.
- `http://localhost:3000/lab/space-maze` - game; normal project launch: `npm run dev`.
- `components/avatar-profile/` - office; `components/games/space-maze/` — HUD, stage and fitting room.
- `lib/avatar/` — general profile and skeletal character; independent of the labyrinth.
- `lib/space-maze/` — content, map generation, movement, opponents and tests.
- `public/game-assets/space-maze/provenance.json` - GLB origin/hashes.
- `scripts/prepare-space-maze-assets.mjs` - reproducible import of source GLBs from `tmp/space-kit/`; Sources and links are indicated in provenance.

All four models used - 2,692,700 bytes in total; at the first level you need a person and one scout. One human GLB is used by both skins. Changing a skin does not require a second copy of the geometry on disk. WebP background - 137,774 bytes. This is the size of the files, not the full size of the first load with JavaScript and does not measure the speed of the phone.

### Functional tests

- `npm run build`: successful production build, new routes are present.
- `npm run typecheck`: successfully.
- `npm run lint`: successfully.
- `npm test`: 20 files, 134 tests, all successful. New tests: 18 for the maze and 2 for the profile.
- All 10 maps are tested for connectivity, safe spawns, and each answer being reachable **without having to go through another beacon**. The latest scan found and corrected a level 4 issue.
- Browser/IAB: `/profile` → “Mars” → save → labyrinth → reload → “Mars” saved → correct answer → next level → same skin.
- Reverse path: cabinet → “Orbit” → save → reboot → selection and real model saved.
- Tested: on-screen buttons, ArrowRight/Space from the keyboard, pause, restart, incorrect answer/explanation/loss of life, collision, item change, level 10 with three enemy models, switching lightweight graphics.
- Screens tested were 1280x720, 1536x1024, 390x844 and 844x390. The game does not have horizontal overflow. In portrait the controls are from below, in landscape they are on the right.
- There are no Framework overlay or JavaScript/WebGL errors on the tested routes. There is a Next.js warning about global `scroll-behavior: smooth` from an existing design - does not block navigation; the existing global rule was not changed.

### Visual check and difference from concept

Concepts are created by the built-in Image Gen, not an external paid API. Two concepts: `concept-light-v1.png` and `profile-concept-v1.png` in `docs/games/space-maze/`. A separate plate is saved as `public/game-assets/space-maze/orbit-light.webp`.

Key brief of the game: light orbital station, white HUD, Onest, turquoise wall seams, low volumetric partitions, a man-astronaut, three beacons with HTML signatures; no dark hats, hamsters or heavy post-effects. Brief of the office: white screen, “Personal Account” header, 3D preview on the left, two “Orbit”/“Mars” skins on the right, green save and transition to the labyrinth.

Concepts and actual screenshots reviewed via `view_image`, including comparison at 1536x1024:

| Verifiable | Result / perceived difference |
| --- | --- |
| Palette | White UI, turquoise accents, green actions; no dark hats |
| Game structure | Question from above, independent 3D field, answers and control from below; in landscape moved to the right for readability |
| Font and text | Code Onest, Russian signatures, question and answers are not baked into the image |
| Character | Real humanoid GLB with animations; **silhouette is more angular than the concept**, this is a licensed model of the first prototype, not the final custom character |
| Skin selection | Live 3D preview and two palette samples; instead of fictional cards with renderings of another character, samples of actual materials are used |
| Environment | Separate generated plate + real walls/beacons; there are fewer small parts and plants than in the concept |
| Adaptability | Portrait 390×844 and landscape 844×390 without horizontal scrolling; long questions do not cover the field |
| Texts on top of the concept | Only functional elements have been added: item/level selection, character, easy mode, restart, explanation of local storage |

This is a working technical prototype, **not final artistic quality 10/10**. The next art pass is your own round model/clothing based on the concept on a coordinated skeleton; not replacing 3D with a beautiful static picture.

### What has not yet been tested / implemented

- Physical Android, real FPS/heating/memory and long-term gaming on a weak device. Browser size emulation does not prove these characteristics.
- Server accounts, purchases, achievements and clothing distribution. A local profile is not proof of item ownership.
- Connecting the tutor editor and task images to the new route. There are currently three demo items; short sets of English/Biology are repeated at subsequent levels.
- Final balance of all ten levels with real students; The reachability autotest does not replace the complexity playtest.
- Production security: `npm audit --omit=dev` notes vulnerabilities of the existing stack (including Next.js). This is a separate mandatory step **before publication**; Risky bulk dependency updates were not performed as part of the game prototype.

## 12. Game cut - October 4, 2026

The current state of the game complements the historical report above:

- Generic human character reading `hoodie`/`jacket` from the office. The artistic status of the models is separately recorded in `games/space-maze/AVATAR_MODEL_HANDOFF.md`: the coloring of the hoodie and the second set still require improvement to the approved reference.
- An immediate turn in the corridor preserves the hero's position; upon release, he completes the return to the cage without an extra step. Turns at intersections are still buffered.
- You can drag across the playing field with your finger or mouse: a local joystick appears, the direction is determined by the displacement. Releasing, releasing the pointer, and losing the grip release the hold. On-screen arrows and WASD remain available.
- After the collision, a splash at the impact site, the protective shell and the protection countdown are visible. Training errors and collisions are counted separately.
- Winning shows the answer on the first attempt and the time; progress and totals use actually completed levels. When manually selecting the tenth level, the results do not include completion of the previous nine.
- At the beginning of the level, the characters are facing the camera; During the game, direction is determined by movement.
- Demo content: 12 items, 120 original short questions with explanations, 10 different questions in each set. Subjects: mathematics, English, Russian, biology, the world around us, physics, chemistry, geography, history, computer science, literature, social studies. These are pattern testing kits and not complete curriculum coverage.

### Checking the game loop

- Autotests run all ten cards through normal movement commands to the correct beacon, bypassing incorrect answers. For this check, threats are isolated by protection; collisions are checked by separate tests.
- In the browser: incorrect answer → explanation → repeat; correct answer → next level → updated progress; tenth level with three enemies → victory → results → new expedition.
- Tested: dragging across the field, releasing the gesture, ArrowRight, Space, pause and restart. The hero's screen position is accessible to assistive technologies.
- Layouts 1536x1024, 390x844, 844x390: without horizontal overflow and cropped main buttons. There are no application errors in the checked tab.
- Assembly, typecheck, lint and 146 tests passed. Real Android/FPS has not been measured yet.

### Checking against a visual reference

The landmark remains `games/space-maze/concept-light-casual-v3.png`. Tested white HUD, turquoise accents, light station background, question/field/answer placement, and typography readability. Actual screenshot tested at native landmark dimensions of 1536x1024. The added controls, progression and feedback are driven by the game loop. The wall decor, materials and character do not yet match the artistic detail of the concept; 10/10 rating is not stated.
