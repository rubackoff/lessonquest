# Interactive effects libraries: audit and implementation plan

Review date: July 31, 2026.

## 1. Solution

OriginKit, React Bits, Canvas UI and HyperUIX Vault are not used as a new design system or as a global site dependency. These are source directories for a separate **interaction layer**: card physics, reward feedback, transitions between rounds and optional atmospheric layers of game worlds.

The main interface of the tutor remains light, calm and similar in structure to the familiar Wordwall editor. It should not contain background particles, cursor trails, magnetic headers or WebGL. More expressive movement appears within the player and only where it explains the action or enhances the result.

We do not install the entire four libraries. Source-first approach:

1. choose one specific pattern;
2. we check the license of its version;
3. copy the minimal source into your own component;
4. we translate colors, geometry, typography and durations into our tokens;
5. remove demo content and unused dependencies;
6. add touch, keyboard, reduced motion and static fallback;
7. We load the effect dynamically only in the desired game or theme.

## 2. What is in the sources

### OriginKit

Website: <https://www.originkit.dev/>

The strength is ready-made expressive interactions for React and Framer, which can be customized and copied into the project. Especially useful for games:

- `Click Effects`: six options for responding to pressing; the implementation uses GSAP;
- `Draggable Grid` and `Draggable Sticker`: starting point for drag physics;
- `Swipe Stack`: basis for card deck and swipe solutions;
- `Emoji Burst`, `SVG Particle`, `Star Burst`: short reward for an important result;
- `Pixel Card`, `Pixel Reveal`, `Sticker Peel`: opening or turning over a learning object;
- `Magnetic Hover Button`: behavior of one main CTA button, not all controls;
- `Reactive Grid`, `Dot Matrix`, `Line Ripple Background`: Background presets for individual game worlds.

Limitation: the library is in beta, and the public license terms of the components were not found during the check. Until an explicit license is obtained, OriginKit is used as a visual and technical reference. The source from it is not automatically transferred to production.

### React Bits

Website: <https://reactbits.dev/>  
Repository: <https://github.com/DavidHDev/react-bits>

The strength is a large source-first library of React components with TypeScript/CSS, TypeScript/Tailwind options and installation via the shadcn registry. Useful for the product:

- `Option Wheel`: bonus quiz mode or topic selection, but not the main navigator;
- `Dock`: compact gaming toolbar on desktop;
- `Dot Field`, `Shape Grid`, `Soft Aurora`: calm thematic ambience layers;
- `Pixel Trail`, `Magic Rings`, `Ribbons`: rare effective effects;
- `Magnet Lines`, `Antigravity`, `Ballpit`: references for future arcade games, not for the editor;
- `Splash Cursor` and `Blob Cursor`: do not use globally; valid only as mechanics of a special game.

License: MIT under Commons Clause. You may use and modify the components in personal and commercial applications, but you may not sell, sublicense, or distribute the components themselves individually, as a bundle, or as a port. The license text and copyright notice are saved in `THIRD_PARTY_NOTICES.md` and next to a significantly borrowed source.

### Canvas UI

Website: <https://canvasui.dev/>  
Repository: <https://github.com/DavidHDev/canvas-ui>

The strong point is independent TypeScript/WebGL engines with thin React wrappers. Useful for the product:

- `Ripple`: local wave of correct connection or completion;
- `Force Field`: short effect of protecting a series of correct answers;
- `Particle Reveal` and `Decrypt Reveal`: mechanics “show the answer”;
- `Particle Object`: reward or special arcade object;
- `Liquid` and `Droplets`: underwater theme;
- `Clouds`: natural or geographical world;
- `Grid`, `Hex Float`, `Magnify`: physics, computer science, geometry;
- `Retro Dither`, `VHS`, `Glitch`: rare teenage presets, not basic style.

License: MIT with Commons Clause; use within a commercial product is permitted; resale of the component library is prohibited.

An important technical limitation: some of the effects that redraw live HTML in the canvas depend on the experimental browser capability and, outside the supported mode, degrade to overlay/fallback. Therefore, such components are not involved in the main training mechanics. Regular WebGL overlays should also have static CSS/PNG fallback.

### HyperUIX Vault

Website: <https://vault.hyperiux.com/effects>  
Documentation: <https://vault.hyperiux.com/docs>

Strengths: source-first patterns for React/Next.js with CLI and good production guidelines. There are 115 effects in the catalog at the time of review: 32 free and 83 Pro.

From the free part, we first consider small button, text and transition patterns. Pro effects are not included in the repository without a purchased license covering SaaS and the number of projects.

Free Core is allowed for personal and commercial projects, client work and SaaS, but the license is checked for each file. Pro works on a commercial plan. You cannot turn Vault sources into your own directory, template pack, or public component registry.

## 3. Map “pattern → our game”

| Our mechanics | What we take as a basis | How it should feel | What we don't take |
| --- | --- | --- | --- |
| Couples | Draggable Sticker/Grid, Click Effects, Ripple | the card rises slightly, the line stretches, the right pair gently interlocks and gives a short wave | cursor trails all over the screen, constant particles |
| Groups | Draggable Grid, Force Field | the object has weight, the zone reacts even before it is released, the correct drop springs into place | free physical chaos and long rebound |
| Blitz quiz | Option Wheel as a separate bonus mode, Magic Rings | the choice is quick, the answer is recorded without delay, the series receives a rare enhanced reward | wheel as the only way to answer, WebGL on every question |
| Memory Deck | Swipe Stack, Sticker Peel | the card feels like a stack, the swipe is directed, the next card is visible in advance | 3D revolution for the sake of decoration and excessive inertia |
| Find the error | Decrypt Reveal, Magnify | the search feels like an inspection; hint locally manifest area | global glitch, impairing text readability |
| Forces Laboratory | Force Field, Grid, Particle Object | the reaction is related to the magnitude of the force and direction, not to the finished screen saver | HTML-in-canvas as a mandatory part of the calculation |
| Future arcade | Antigravity, Ballpit, Magnet Lines, Tetris | physics becomes mechanics itself, learning content manages obstacles and goals | transfer of library demonstration without training cycle |

## 4. Single layer of components

Target directories:

```text
components/
  motion/
    game-pressable.tsx
    spring-card.tsx
    reward-burst.tsx
    ripple-feedback.tsx
    swipe-deck.tsx
    ambient-layer.tsx
lib/
  effects-registry.ts
  motion-profile.ts
third-party/
  THIRD_PARTY_NOTICES.md
```

No game imports a third party effect directly. It calls our semantic primitive:

```ts
type EffectId =
  | 'reward-burst'
  | 'success-ripple'
  | 'drop-snap'
  | 'swipe-settle'
  | 'ambient-dots';

type EffectPolicy = {
  tier: 'essential' | 'feedback' | 'ambient';
  renderer: 'dom' | 'canvas2d' | 'webgl';
  lazy: boolean;
  reducedMotionFallback: EffectId | 'static' | 'none';
  lowPowerFallback: EffectId | 'static' | 'none';
  maxInstances: number;
};
```

This way we can replace the implementation source without rewriting the games, centrally limit the intensity and not mix the external visual language with ours.

## 5. Rules for visual adaptation

- All external hex colors are replaced with semantic ones `--ds-*` tokens.
- Turquoise remains an interactive accent, green is only a success, coral is a mistake or an important contrasting event.
- Dark blue does not become the basis of the site. It is only valid as a local theme scene color with a guaranteed light game material on top.
- The main surfaces are light and warm; WebGL does not change text color or reduce job contrast.
- The radii and shadows are taken from our design system, not from the demo component.
- The duration of a typical reaction is 120–420 ms; celebration - no more than 700 ms and only on a significant event.
- A continuous background moves slowly, takes up no more than one composited/canvas layer, and stops outside the viewport.
- `prefers-reduced-motion` removes movement, particles and parallax, but maintains a clear result through color, outline, icon and text.
- There is no required hover state on touch. The minimum active area is 44 × 44 px.

## 6. Performance budget

| Level | Allowed | Budget |
| --- | --- | --- |
| Editor and library of materials | DOM/CSS transitions | without WebGL and endless canvas-loops |
| Base game | one DOM or Canvas2D feedback-layer | reaction does not block next input |
| Theme World | one lazy ambience-layer | loaded only after shell and task |
| Arcade | one main Canvas/WebGL renderer | don't add a second heavy full-screen renderer |

Mandatory checks: Chrome, Safari, Firefox, Android Chrome, iOS Safari; desktop 60 fps as a goal, budget mobile devices are not lower than a stable 30 fps; lack of layout shift; cleaning `requestAnimationFrame`, event listeners and WebGL resources on unmount.

## 7. Implementation sequence

### Stage 1 - basic sensations

1. `GamePressable`: uniform press/focus/touch response for game buttons and cards.
2. `SpringCard`: lift, drag and return without changing the training logic.
3. `RewardBurst`: DOM/SVG splash for proper pairing, series and completion.
4. `RippleFeedback`: local wave from connection point or drop.
5. `SwipeDeck`: A controlled stack for the Memory Deck.

The source for the first stage is React Bits with a verified license notice and OriginKit’s own adaptation of ideas. Canvas UI is currently used only as a reference for the Canvas2D version of ripple: WebGL is not needed for such small feedback.

### Stage 2 - thematic layers

1. `AmbientDots` for science and a neutral teen theme.
2. `AmbientGrid` for mathematics, physics and computer science.
3. `AmbientParticles` for space.
4. `AmbientDroplets` for the underwater world.

Each layer has `static`, `reduced` and `full` modes. The age preset chosen by the tutor changes the intensity, not the rules of the game.

### Stage 3 - new arcades

Only after stabilizing the primitives do we analyze Antigravity, Ballpit, Magnet Lines and Tetris into game laws: gravity, collision, attraction, stacking. Training content must influence the trajectory, goal or decision, otherwise it is a decorative screensaver, not a simulator.

## 8. What do we do first in the current code?

The first source-first slice is already built into player:

- `ClickSpark` — Canvas2D response to game buttons and cards without a constant animation loop;
- `DotField` — interactive dot layer of the “Steam” scene with individual colors of the five themes;
- `SpotlightCard` — local illumination of task and control panels;
- `prefers-reduced-motion` turns off sparks, fixes the mesh and reduces its contrast;
- license and links to upstream are saved in `third-party/THIRD_PARTY_NOTICES.md`.

The first production pass is “Pairs”:

1. replace scattered press/hover with `GamePressable`;
2. add spring-return for invalid connection;
3. add `RewardBurst` only for the right couple and a separate reinforced version for completion;
4. make ripple from connection point;
5. check mobile, keyboard, reduced motion and four themes;
6. after visual confirmation, transfer the same primitives to the “Groups” and “Memory Deck”.

## 9. Acceptance criteria for one external pattern

- the source and source version are recorded;
- the license allows use in commercial SaaS;
- mandatory notice saved;
- demo styles are completely replaced by our system;
- no global selectors and global pointer listeners unnecessarily;
- the effect does not break keyboard and touch;
- there is reduced-motion and low-power fallback;
- the component is dynamically loaded if the first screen does not need it;
- no leak of RAF, timers, observers or WebGL context;
- visual regression completed on desktop and mobile;
- The educational state remains clear when the animation is completely turned off.

## 10. Bottom line

The most useful libraries for the next MVP are React Bits as a legal source-first source of React patterns and Canvas UI as a source of ideas and independent WebGL engines for future thematic layers. HyperUIX is useful for individual transitions after checking a specific Free/Pro plan. OriginKit currently provides the strongest game references, but porting the code is delayed until a clear license is available.

The main change in approach: we no longer try to manually invent every hover, drag, burst and reveal. We collect our own small set of gaming primitives from proven patterns and consistently apply them to all subjects and age modes.
