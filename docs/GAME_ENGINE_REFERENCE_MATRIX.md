# Game references and Phaser feature map

Audit date: July 31, 2026.

This document does not record a general “moodboard”, but a verifiable connection:

`learning task → game mechanics → motion pattern → Phaser system → visual reference → readiness criterion`.

## 1. Honest product status

Installed and recorded in the project `phaser@4.2.1`. All six basic templates have already been switched to the hybrid Phaser renderer; Frame-by-frame browser QA and visual polishing of new scenes are being completed.

| Template | Current renderer | Visual reference | Status |
| --- | --- | --- | --- |
| Couples | `phaser-v1` | `docs/games/match-pairs/mockup-desktop-v3.png` | The hybrid Phaser version works; lines transferred to `Phaser.Curves.CubicBezier`, feedback - on pooled `ParticleEmitter` |
| Groups | `phaser-v1` | `design-references/group-sort/group-sort-light-arcade-v2.png` | New hybrid renderer is included in Student, Studio and Editor; desktop/mobile, correct/wrong, one canvas and clean console tested in browser |
| Quiz | `phaser-v1` | `design-references/quiz-rush/quiz-rush-light-arcade-v1.png` | Hybrid renderer is connected; correct/wrong/advance, desktop/mobile, one canvas and clean console checked in browser |
| Cards | `phaser-v1` | `design-references/recall-deck/recall-deck-light-arcade-v1.png` | Hybrid renderer connected: available card and swipe in DOM, Phaser deck, trays, flight and pooled particles; browser QA running |
| Find the error | `phaser-v1` | `design-references/mistake-arena/mistake-arena-light-arcade-v1.png` | Hybrid renderer connected: DOM-hotspots, Phaser scanner, spotlight, impact ring and feedback particles; browser QA pending |
| Forces Laboratory | `phaser-v1` | `design-references/force-lab/force-lab-light-arcade-v1.png` | Full-scene hybrid renderer connected: Phaser owns vector, target, rover and gate; the exact values ​​and keyboard/a11y remain in the DOM; browser QA running |

Source of status in code: `lib/game-runtime/renderer-registry.ts`, tested against real imports and mount points.

Important: the current registry is still declarative and is used only by the test. `StudentPlayScreen`, `LearningStudio` and `ActivityEditor` still branch independently `gameId`, although now they statically import new renderers for all six games. Therefore, simply changing the value in the registry does not in itself switch anything. Before removing legacy, you need a single real adapter/mount point for all three consumers.

Consequence: the quality is not limited by the engine, but by incomplete migration and insufficient use of Phaser 4 capabilities.

## 2. Why are we staying on Phaser 4.2.1?

There is no need to change the stack again.

- Next.js is responsible for the editor, library, routes, API, authorization and reports.
- React/DOM is responsible for accessible text, forms, system HUD and complex training content.
- Phaser is responsible for the game scene, continuous input, curves, particles, camera, filters, lighting, sound and choreography.
- A typed bridge remains between the DOM and Phaser; training logic is not hidden inside Scene.

[Phaser 4.2.1](https://github.com/phaserjs/phaser/releases/tag/v4.2.1) is the current recorded release of the project. In Phaser 4, the WebGL renderer has been completely redesigned, unified filters, new Gradient/Noise game objects, improved lighting, Mesh2D and stencil rendering have been added. For our 2D simulators, this is the right level: noticeably richer than regular DOM, but simpler and lighter than Unity/Godot in the browser.

## 3. The official Phaser library we use

The main source is [Phaser 4 Labs](https://labs.phaser.io/) and [official examples repository](https://github.com/phaserjs/examples). The code for the examples is released under MIT, but their images and sound are not. We use API patterns and write our own art/audio kit.

| Problem | Proven example | Application with us |
| --- | --- | --- |
| Raise the dragged card above the others | [Bring Dragged Item To Top](https://labs.phaser.io/phaser4-view.html?src=src%5Cinput%5Cdragging%5Cbring%20dragged%20item%20to%20top.js&return=phaser4-index.html) | Pairs, Groups, Cards |
| Drop zones and entry/exit states | [Drop Zone](https://labs.phaser.io/view.html?src=src%2Finput%2Fzones%2Fdrop%20zone.js) | Magnetic stations "Group", vector pen in the laboratory |
| Return, overshoot and soft adhesion | [Elasticity](https://labs.phaser.io/view.html?src=src%2Ftweens%2Felasticity.js), [Tween concepts](https://docs.phaser.io/phaser/concepts/tweens) | `lift → flight → snap → settle`, incorrect `reject → return` |
| Cascading appearance of objects | [Stagger Showcase](https://labs.phaser.io/view.html?src=src%2Ftweens%2Fstagger%20showcase.js) | Cards, answers, round results |
| Flash without creating hundreds of DOM nodes | [Explode Emitter](https://labs.phaser.io/view.html?src=src%2Fgame%20objects%2Fparticle%20emitter%2Fexplode%20emitter.js) | Accepting a card, series of answers, completing a level |
| Glowing point on the curve | [Sparkle Trail](https://labs.phaser.io/view.html?src=src%2Fpaths%2Ffollowers%2Fsparkle%20trail.js) | Lines of pairs, magnetic trace of sorting, trajectories of force |
| Local impact and rare camera accent | [Camera Shake](https://labs.phaser.io/view.html?src=src%2Fcamera%2Fshake.js) | Quiz and Lab arcade states only; don't shake calm games |
| Mask/reveal | [Soft Shape Mask](https://labs.phaser.io/view.html?src=src%2Factions%2Fadd%20mask%20shape%20soft.js) | Opening card, magnifying glass and spotlight, progress bar |
| Neat glow | [Add Effect Bloom](https://labs.phaser.io/view.html?src=src%2Factions%2Fadd%20effect%20bloom.js) | Only the active object, the right goal and the final emphasis |
| Lively but light background | [Animated Gradient](https://labs.phaser.io/view.html?src=src%2Fgame%20objects%2Fgradient%2Fanimate%20gradient%20offset.js), [Simplex Noise](https://labs.phaser.io/view.html?src=src%2Fgame%20objects%2Fnoise%2Freflections%20with%20simplex%20noise.js) | Light studio, caustics of the underwater world, laboratory field |
| Responsive hybrid canvas | [Resize and Fit](https://labs.phaser.io/view.html?src=src%2Fscalemanager%2Fresize%20and%20fit.js) | `RESIZE` for DOM + Phaser; `FIT` only for fully canvas arcades |
| Transition between large scenes | [Pixelate Scene Transition](https://labs.phaser.io/view.html?src=src%2Ffilters%2Fpixelate%2Fpixelate%20transition%20scene.js) | Start, outcome and change of the world, but not every question |

### Limiting Effects

An effect is only used if it explains an action. There is one main focus on one event. Bloom, shake, particles and sound do not turn on at the same time for no reason.

## 4. References of games made on Phaser

This is proof of the engine's capabilities and a source of principles, not assets to be copied.

| Reference | What's useful in it |
| --- | --- |
| [Amazing Word Fresh](https://phaser.io/news/2026/03/amazing-word-fresh-free-word-puzzle-game) | Blank field, falling letters, continuous board update, no time pressure mode |
| [Ice Maze](https://phaser.io/news/2026/02/icemaze-game-based-learning-english-classroom) | Learning content is embedded in a real spatial game; teacher adjusts time, obstacles and hints |
| [Bauhaus Builder](https://phaser.io/news/2026/05/bauhaus-builder-gamedevjs-winner) | Expressive custom graphics and readable physics prove that Phaser doesn't limit us to "widgets" |
| [Lumenia](https://phaser.io/news/2026/04/lumenia-phaser-game) | One clear gesture, minimal scene, strong light response and separate quiet mode |
| [Hide and Luig](https://phaser.io/news/2026/02/hide-and-luig) | Simple mechanics become gripping through staging, humor, pacing and unexpected environmental reactions |

## 5. Modern educational references

### General product model

- [Blooket Game Modes](https://help.bloomet.com/hc/en-us/articles/21408591795351-Blooket-Game-Mode-Previews): One question set runs in over 25 modes. Let's take the separation of content from the game.
- [Gimkit Game Balance](https://help.gimkit.com/en/article/game-options-explained-16312ua/): The teacher adjusts the balance of questions and game action. Let's take a pedagogical setting of intensity.
- [Kahoot Experiences](https://support.kahoot.com/hc/en-us/articles/35636870654867-Kahoot-experiences): One material gets calm, team and competitive scenarios. We take a clear choice of mode.
- [Wayground question types](https://support.wayground.com/hc/en-us/sections/16356540533657-Use-Different-Question-Types): Match, Categorize, Drag-and-Drop, Hotspot, Graphing and Labeling. We cover different subjects and answer types.
- [Duolingo Adventures](https://blog.duolingo.com/adventures/): knowledge is applied within a small scenario, the environment reacts to actions. We take the character as a participant in the feedback, and not the decor.
- [PhET](https://phet.colorado.edu/): Direct control of the domain model and immediate connection between object, graph and number. We take the research cycle, not their code or images.

### What is important not to repeat

- mandatory timer and leaderboard;
- luck-heavy rewards and points theft;
- penalty for age or slower pace;
- the same children's style for all users;
- separate content format for each game.

## 6. Motion grammar of the entire platform

Each reaction has one sequence:

`intention → anticipation → action → contact → result → reassurance`.

| Phase | Time | Visual reaction |
| --- | ---: | --- |
| Hover/focus | 100–160 ms | local lift, shadow change, clear focus ring |
| Capture | 120–180 ms | scale `1.03–1.06`, object above layer, slight tilt in speed |
| Flight/drag | continuously | light or trail lags by 1–2 frames, the target reacts in advance |
| Contact | 90–140 ms | squash targets, short glow, tactile sound |
| Correct | 320–520 ms | magnetic snap, 8–16 particles, corgi reacts after object |
| Error | 280–460 ms | local recoil, coral contour, arc return; without shaking the entire screen |
| Settle | 180–300 ms | the field is rebuilt only after the main movement is completed |

For `prefers-reduced-motion` color, text, icon and final position are preserved, but trail, shake and long overshoot are removed.

## 7. Six Game Card

### 7.1 Couples

The database remains similar to Wordwall: two clear columns and content cards. Modernity is not given by random 3D tiles, but by magnetic line, travelling pulse, precise snap and reactive world.

- Phaser: `Curves.CubicBezier`, follower/highlight, one pooled emitter, Gradient/Noise ambience.
- DOM: text, tutor images, keyboard focus.
- Modes: calm; blitz up to 90 seconds; image ↔ word; audio ↔ word.
- Criterion: the line does not lag behind the card; the error does not break spatial memory; 8 pairs are read on mobile.

### 7.2 Groups

The main image is three live stations and a conveyor belt. Cards can contain text, a formula, a diagram, or an image of a tutor.

- Phaser: target halos, magnetic trail, particles, station squash, ambient Gradient/Noise.
- DOM: available cards and category labels; pointer coordinates go through the bridge.
- Modes: drag in station; fast swipe in 2–4 directions; sequential conveyor.
- Criterion: station expands before release; the correct card physically “sits” on the platform; the incorrect one returns in an arc; the rest of the row is reassembled after settling.

### 7.3 Quiz

The educational question remains the center. The arcade layer turns a series of correct answers into a short action, but does not distract after each click.

- Phaser: energy token flight, streak particles, Gradient/Noise field, rare camera accent.
- Modes: without timer; accuracy; speed; mini-arcade after 3–5 answers.
- Criterion: the response gives a local result in 150 ms; the explanation remains readable; the metagame doesn't change the validity of the question.

### 7.4 Cards

Not just a flip-card: the student first remembers, then opens, and then gestures to assess confidence.

- Phaser: soft mask reveal, damped-spring swipe, stacking settle, mastery particles.
- Modes: know/repeat; entering a response; memory grid; separate error deck.
- Criterion: content is not mirrored or blurred; swipe can be canceled; the adult mode does not look childish.

### 7.5 Find the Mistake

The error could be in a formula, text, code, map, graphic, image, or order of steps.

- Phaser: spotlight mask, lens distortion only when focused, local recoil, impact ring.
- DOM/SVG: Accurate tutorial text and accessible hotspot areas.
- Modes: one error; some; drag fix; restore sequence.
- Criterion: the idle scene does not provide a response; hit area matches the image after resize; the explanation comes after the reaction, not on top of it.

### 7.6 Forces laboratory

Cycle: `predict → tune → run → observe → measure → explain`.

- Phaser: native input, curves, particles, field Gradient/Noise, filters, local camera, if necessary Box2D/Arcade Physics.
- DOM: condition, numeric input, units, graphs with precise labels.
- Options: strength; trajectories; levers; electrical circuits; optics; chemical models.
- Criteria: The visual model and the calculated state use the same data source; parameters change in real time; physics is tested separately from the renderer.

## 8. Age and tone

One mechanic receives three intensity profiles, but the content does not change.

| Profile | Corgi | Effects | Tempo |
| --- | --- | --- | --- |
| Calm Adult | start, series, result | local, no confetti for each answer | without mandatory timer |
| Dynamic | visible assistant | trail, particles, short series | soft timer optional |
| Arcade | active participant in the world | full production and sound | short rounds and risk by choice |

The basic palette does not change: light canvas `#F5F7F8`, white surfaces, text `#18212D`, turquoise interactive accent `#138B8F`, green success `#15945B`, coral bug `#E84D55`. Dark backgrounds are only allowed within the selected game world.

## 9. Implementation procedure

1. Make registry the real mount point: `{ version, kind, load }` and one adapter for Student, Studio and Editor.
2. [Done] Translate “Pairs” to native curves and pooled particles; ambience and motion grammar remain the basis for the following renderers.
3. [Done] Reassemble “Groups” on a separate frame `v2`, connect `phaser-v1` in all three consumers and check correct/wrong, mobile, one canvas and a clean console.
4. Bring out only proven primitives: `MagneticTarget`, `ParticleBurst`, `MotionTimeline`, `AmbientField`, `CorgiStateMachine`.
5. [Code completed, browser QA continues] Move Quiz, Cards, Find the Bug and Lab - one template each, with a visual gate and browser QA after each.
6. Only after six basic games should we make the first independent arcade game on the existing quiz-content.

The rule is unchanged: reference → motion spec → renderer → desktop/mobile/touch/keyboard/reduced-motion QA. The massive “redrawing of all screens with one CSS pass” is no more.
