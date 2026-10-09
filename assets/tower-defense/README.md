# Assets of the “Base Defense” draft

Created by built-in ImageGen on October 7, 2026.

## Current version based on user reference

- `arena-long-route.png` → `public/game-assets/tower-defense/arena-long.webp`: a separate environment with a smaller portal and base and four smooth turns in the road. There are no characters, towers or interface in the background.
- `towers-reference.png` → `public/game-assets/tower-defense/tower-0.webp`–`tower-2.webp`: Transparent atlas of laser, cryogenic and pulse towers. Cells of equal width are divided and optimized without changing the pattern.
- `arena-reference.png` — an intermediate version of the environment before the request to make objects smaller and lengthen the path.
- Current visual reference: `docs/games/tower-defense/concept-reference-simplified-v2.png`, created by editing a user-provided reference.

Environment prompt: preserve quality, top view, stone surfaces, water and light reference; remove the interface, enemies, towers, hero and pets; reduce the base and portal, build a longer road with four smooth turns. Prompt towers: three separate transparent images in equal cells, a cyan laser cannon, a cryogenic tower with blue crystals and an orange pulse cannon; preserve materials, platforms, light and reference angle, without text and long rays.

## Early assets and origins

- `alien-source.png` — transparent original alien; The game uses an optimized `public/game-assets/tower-defense/alien.webp`.
- `stone-source.png` — seamless stone coating, built-in ImageGen. Optimized texture: `public/game-assets/tower-defense/stone.webp`. Prompt: strictly top view, large light limestone slabs with soft uneven edges, sparse moss in the seams, calm stylized playful texture; without objects, paths, text or directional lighting.
- `docs/games/tower-defense/concept-top-down.png` — concept of a screen with a camera on top. Subsequent simplification of the decor and lengthening of the route were carried out according to the direct clarification of the user.
- Three pets are reused from `public/game-assets/character-heist/pet-0.webp`–`pet-2.webp`. Their original atlas and origins are in `assets/character-heist`.
- The hero's GLB has not changed. The current render combines a static environment, individual sprites, and the original 3D model of the hero. Shots and game logic are calculated in code. Text and actions - HTML.

Prompt asset: one cute purple alien in the style of a toy 3D render, oval head, large dark eyes, small body with arms and legs, light space suit, three-quarter view; without weapons, inscriptions, gender and background; real transparent background. The created game concept was used as a style reference.

Prompt of the final concept: full screen of a Russian educational tower-defense game, a white educational panel on the left, three types of towers and an example of multiplying by 7; on the right is a compact arena strictly from above, a winding road from the purple portal to the mint base, our saved hero and three pets at the base. The user then asked for fewer details and a longer route.
