# Origin reference v2

File: `group-sort-light-arcade-v2.png`  
Date: July 31, 2026  
Mode: built-in ImageGen, one project-bound asset.

## Input images

1. `group-sort-light-arcade-v1.png` — source composition and edit target.
2. `docs/games/match-pairs/mockup-desktop-v3.png` — the standard for the quality of game materials and readability of interaction; water and dark HUD were not tolerated.
3. `public/corgi-coach-full-v3.png` — identity/anatomy anchor corgi.

## Final prompt

```text
Use case: ui-mockup
Asset type: shippable high-fidelity 16:9 desktop game screen reference for the tutoring template “Groups”
Input images: Image 1 is the edit target and layout anchor; Image 2 is the approved interaction-quality and material reference only; Image 3 is the exact corgi identity/anatomy anchor.
Primary request: refine Image 1 into a premium modern arcade sorting game that can realistically be implemented with Phaser 4 plus accessible DOM content. Preserve the core mechanic: three large category stations above a conveyor of tutor-authored cards. Show one card actively being dragged toward the middle station along a restrained curved turquoise magnetic trail; the destination platform anticipates the drop by expanding slightly, glowing at the rim, and releasing a very small controlled particle sparkle. The remaining cards settle neatly on the conveyor. Make the interaction and depth feel as polished and intentional as a commercial casual game, not a web dashboard.
Scene/backdrop: bright airy “Corgi Classic” learning studio; white, ivory and very pale cool gray surfaces; subtle daylight, restrained texture and soft depth; absolutely no underwater world and no dark header.
Subject/layout: full-screen game scene only. A slim light HUD at the top with the exact Russian title “Arrange into groups”, subtitle “Drag the card to the appropriate collection”, and progress “1 of 6”. Three readable stations labeled exactly “Algebra”, “Physics”, “Russian language”. Cards demonstrate reusable tutor content slots with short formulas/text and one simple diagram placeholder. The stage must clearly support arbitrary text, formula, diagram or uploaded image without changing its geometry.
Style/medium: realistic product UI mockup with premium stylized 2.5D game materials, precise spacing, one coherent light source, restrained tint-matched shadows, crisp non-generic components.
Color palette: canvas #F5F7F8; warm cards #FBFAF6; ink #18212D; interaction turquoise #138B8F; success green #15945B; small warm amber category accent allowed; coral only for error and do not show an error state.
Character: keep the corgi recognizable from Image 3, friendly and less AI-looking, seated naturally at lower left with exactly four anatomically correct legs/paws, no extra limbs, no underwater outfit; teal bandana is allowed. The corgi should react toward the dragged card but not block content.
Typography: Onest-like clean sans serif, readable Russian, no tiny captions, no distorted letters.
Constraints: preserve practical screen hierarchy and clear hit targets; keep content legible; create a credible single gameplay frame, not a mood board or collage; no trademarks; no watermark.
Avoid: generic SaaS panels, sidebars, browser chrome, dark navy or dark green bars, neon cyberpunk, excessive glassmorphism, purple AI gradients, water, bubbles, huge empty space, too many particles, illegible text, malformed formulas, extra dog legs or paws, duplicated objects.
```

## Visual QA

- Russian title, instructions, progress and names of three stations are read;
- light palette matches `docs/VISUAL_PALETTE.md`;
- no water, dark header, side panels and generic dashboard grid;
- the corgi sits naturally, there are no extra limbs;
- text, formula and diagram content slots are visible;
- drag state, magnetic trail and anticipatory target reaction are read from one frame.

## Empty classroom backing

Files: `classroom-background-plate-v1.png` and runtime copy `public/theme-classroom-light-v1.png`.  
Mode: built-in ImageGen, edit/reference mode from `group-sort-light-arcade-v2.png`.

```text
Create a reusable EMPTY 16:9 background plate derived from the supplied light arcade classroom reference. Keep only the environment and lighting: airy premium modern tutoring studio, warm-white wall and floor, soft mint/teal atmospheric tint, subtle daylight from upper center, a restrained leafy plant at the far left edge, a small pale bookshelf with a few books and one plant at the far right edge, faint framed educational line art on the distant wall, gentle 2.5D depth and soft realistic shadows. Remove ALL UI, header, progress, text, letters, formulas, cards, conveyor, stations/pods/platforms, trails, particles, hand cursor, dog/corgi, people, logos and mascots. The central 75% must remain open, bright, low-detail, and high-contrast enough for dynamic game objects over it. No dark navy or dark green, no water, no underwater motifs, no neon sci-fi look. Original polished educational game art, clean but not sterile, no watermark.
```
