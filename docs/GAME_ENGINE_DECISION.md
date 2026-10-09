# ADR: graphics and gaming runtime platforms

Decision date: July 31, 2026.

Executable steps, contracts, file map, performance budgets and acceptance gates are described in [PHASER_MVP_IMPLEMENTATION_PLAN.md](./PHASER_MVP_IMPLEMENTATION_PLAN.md).

## 1. Context and fixable error

The first versions of the base games were implemented as React DOM + CSS animations + a separate SVG layer. This retained editability, custom images and accessibility, but the graphical part remained too similar to the application interface: there was no solid game world, camera, particles, multi-layered lines, character animation and staged transitions.

The problem cannot be solved by more hover effects. We need a separate graphical runtime, as well as a clear line of responsibility between the training data, the accessible DOM and the game renderer.

Working assumption: the existing content schema, editor, response validation and saving of results remain the source of truth. The engine does not gain the power to determine the correct answer and does not store a single copy of the attempt state.

## 2. Verified projects

The status of repositories and npm packages was checked on July 31, 2026.

| Project | Role | Strong point for us | Solution |
| --- | --- | --- | --- |
| [Phaser 4](https://github.com/phaserjs/phaser) | Full-fledged web-first 2D game engine | Scenes, cameras, input, tweens, particles, sound, filters and physics; there is an official Next.js template | The only gaming runtime MVP |
| [PixiJS](https://github.com/pixijs/pixijs) + [@pixi/react](https://github.com/pixijs/pixi-react) | WebGL/WebGPU 2D renderer | Great React integration, particles, filters and sprites, but game systems would have to be assembled separately | Strong fallback, not a second dependency next to Phaser |
| [GSAP](https://github.com/greensock/GSAP) | Timeline engine | Precise sequencing of DOM, SVG and canvas events | Connect pointwise, not as the second owner of each `transform` |
| [Rive React](https://github.com/rive-app/rive-react) | Interactive vector animation | State machine corgi: idle, hint, correct, error, complete | After approval of the final `.riv`-asset |
| [React Bits](https://github.com/DavidHDev/react-bits) | Source-first effects | Ideas for click spark, border, trail and rare backgrounds | Only individual adapted techniques; this is not a game engine |
| [Excalibur](https://github.com/excaliburjs/Excalibur) | TypeScript game engine | Clear Actor/Scene API and physics | Good reserve, but smaller ecosystem and no React renderer |
| [KAPLAY](https://github.com/kaplayjs/kaplay) | Fun-first game library | Very fast mini-game prototypes | For prototypes, not the foundation of dozens of templates |
| [melonJS](https://github.com/melonjs/melonJS) | 2D/2.5D engine | Light runtime, WebGL/Canvas, physics | A high-quality alternative, but without an advantage over the chosen combination |
| [Theatre.js](https://github.com/theatre-js/theatre) | Visual timeline tooling | Convenient visual motion | Non-base dependency: public repository lags behind private development 1.0 |
| [Cocos Creator](https://docs.cocos.com/creator/3.8/manual/en/getting-started/introduction/) | Full 2D/3D engine and visual editor | Strong particles, physics and animation graph; TypeScript runtime and Web Mobile export | The best heavy competitor, but creates a second editor/build pipeline |
| [Godot](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html) | Full open-source engine | Powerful scene editor and 2D/3D | WebAssembly/WebGL2, separate GDScript runtime and more complex browser bridge |
| [Unity](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-technical-overview.html) | Complete commercial engine | Very high 2D/3D visual ceiling | IL2CPP/WebAssembly and a separate C# codebase are redundant for web-first templates |
| [Defold](https://defold.com/manuals/html5/) | Compact cross-platform engine | Small standalone builds and good mobile runtime | Lua/WebAssembly export complicates live communication with the React editor |
| [PlayCanvas](https://developer.playcanvas.com/user-manual/react/) | Web-first 3D engine | React integration and strong 3D runtime | Later for individual 3D labs, not for basic 2D templates |

Don't choose React Three Fiber for MVP: true 3D is only needed for a standalone future game, and for cards, sorting and 2D arcades it will add the cost of assets, camera, lighting and performance without educational benefit.

## 3. Solution

### 3.1. One game runtime

Phaser 4.2.1 becomes the only gaming runtime MVP. The version is definitely fixed because Phaser 4 is a fresh major line. Next.js and React are not replaced: they are responsible for the routes, editor, material library, AI circuit and available training overlay.

“Pairs”, “Groups”, “Blitz Quiz”, “Memory Deck” and “Find the Bug” get a hybrid scene:

```text
React state and content schema
            │
            ├── DOM overlay: text, formulas, images, focus, aria-live
            │
            └── Phaser Scene: world, light, lines, particles, mascot sprites, feedback
```

React and pure session core own level, responses, attempts, timer and result. Phaser receives the finished snapshot and sends only semantic actions or visual events. If WebGL fails, the base game remains fully traversable through the DOM fallback.

### 3.2. Two composition modes, not two engines

- **Hybrid template:** Phaser draws the world and game feedback, React DOM - the content of the task and available controls.
- **Full canvas arcade:** Phaser owns field, camera, game loop, collision and sound; React leaves external HUD, pause and results.

`Portal Rush`, future runner, physics and action mechanics use the second mode of the same Phaser host. PixiJS is not installed “just in case”: two renderer lifecycles, two asset caches and two resource destruction systems do not pay off in MVP.

### 3.3. Motion, GSAP and Rive

- the existing Motion remains for hover/press/layout transitions of the accessible DOM;
- Phaser Tweens and Scene update serve Phaser objects;
- GSAP appears only in staged episodes where you need to synchronize four or more objects or move an element along a complex trajectory;
- Motion and GSAP do not control simultaneously `transform` one DOM node;
- Rive serves one corgi on stage, not flashcards or educational pictures.

## 4. Renderer contract

```ts
type GameStageProps<Level, State, Result, Action> = {
  level: Level
  state: State
  result: Result
  running: boolean
  reducedMotion: boolean
  themeId: VisualThemeId
  onAction: (action: Action) => void
}

type RendererKind = 'dom' | 'phaser-hybrid' | 'phaser-full'

type GameRendererDefinition = {
  kind: RendererKind
  Component: React.ComponentType<GameStageProps<any, any, any, any>>
}
```

We don't need an abstract API that hides all the engine differences. Registry selects a specific renderer, and the overall contract is limited to input level, state, theme, availability, and user events.

## 5. Base Game Scene Layers

Order from bottom to top:

1. static art background in AVIF/WebP;
2. Phaser ambience: light, dust, bubbles, distant objects, slight parallax;
3. Phaser gameplay FX: trajectories, magnetic halo, ripple, burst;
4. accessible DOM cards, images, formulas and buttons;
5. DOM HUD, pause, tooltip and result overlay;
6. corgi: first optimized sprites, later one Rive state machine.

The engine does not create quality itself. Each theme still needs a small art kit: a background without an interface, 2–4 foreground layers, a set of particles, decorative props, corgi states and a short sound kit. The engine is responsible for the assembly, movement and responsiveness of these materials.

## 6. First Pilot: "Couples"

Existing `MatchPairsLevel`, editor, `LearningImage`, answer checking, keyboard and mobile mode are not overwritten.

The first pass should give a measurable visual break from the current version:

1. full screen composition by `docs/games/match-pairs/mockup-desktop-v3.png`, without SaaS side panels inside player;
2. four large cards in a column, a normal area for pictures of the tutor and readable long text;
3. Phaser-world with several depths, slow ambience and static fallback;
4. multi-layer elastic connection: base stroke, glow, travelling highlight and magnetic nodes;
5. target attraction before releasing, spring return on error and snap on success;
6. separate `correct`, `wrong` and `complete` productions synchronized with progress and corgi;
7. the same renderer in the full-screen player and in the scaled preview editor;
8. 60 fps desktop, stable 30+ fps on a budget phone, DPR no higher than 2 and ticker stop outside viewport.

Quality is assessed not by the number of effects, but by the coincidence with the approved composition: card sizes, depth, art, character of lines, reaction of objects, corgi scene and lack of “admin” feeling.

## 7. Integration points

```text
components/game-runtime/
  game-stage.tsx
  renderer-registry.ts
  phaser-host.tsx
  bridge.ts
  session-core.ts
  dom-overlay.tsx
  effects-contract.ts
  phaser-scenes/
```

- server page only passes serializable level JSON to the client player;
- Phaser is loaded via client boundary and dynamic import without SSR;
- resize is bound to the local scene container, not to `window`;
- custom data URL/WebP textures have an owned texture registry and are released when the material is changed;
- ticker and emitters stop at pause, hidden tab, unmount and reduced motion;
- DPR is limited to two;
- canvas has `pointer-events: none`, if hit testing remains in the DOM;
- WebGL failure includes the existing DOM/SVG version.

## 8. Implementation procedure

1. Attach Phaser 4.2.1 and connect it only to “Pairs” via client-only host.
2. Reproduce the approved desktop reference and check the actual walkthrough, images, long texts, mobile and reduced motion.
3. Take out only primitives that have proven useful: ambience, magnetic link, ripple, burst, mascot event.
4. Move primitives to “Groups”, then “Blitz Quiz” and “Memory Deck”.
5. After stabilizing the basic templates, assemble the first full-canvas scene at the same runtime for the existing quiz content family.
6. Don't install GSAP or Rive until there is a specific scene/asset that really needs their capabilities.

## 9. Review Criterion

The decision is reviewed if the "Par" pilot displays at least one of the following:

- Phaser 4.2.1 is unstable with the current version of React/Next;
- memory is not released after 30 consecutive material changes;
- DOM and Phaser systematically diverge in coordinates by resize/zoom;
- low-power fallback requires a separate implementation of the entire game;
- the resulting quality is no different from a simpler DOM/SVG implementation.

In this case, the next candidate is PixiJS 8+ `@pixi/react` for hybrid templates; The decision on a separate arcade runtime is made only after the pilot. You cannot support two implementations of the same base game at the same time.
