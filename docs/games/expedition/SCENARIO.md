# Expedition with construction

Second stage draft, 10/08/2026. Page: `/lab/expedition`. The goal is to use geometric properties to construct a work path. The game ends the episode only after the calculation, testing and transition of the entire team. There is no free map editor.

## Study options

| Menu theme | What does a student do | Conditions of the first mission |
| --- | --- | --- |
| Right Triangle | Selects a direct path or a detour, selects and turns spans, calculates the diagonal | Offsets 6 and 8 m; AB = 10 m. Direct path: parts 8/10/12/14; bypass: 6/8/10/14 |
| Addition of segments | Assembles each of two spans from several parts | AC = 6, SB = 8; parts 2/3/4/5/6 m, four of each length. Total path forecast: 14 m |
| Drawing scale | Converts centimeters to meters, then calculates the diagonal and builds | In the diagram 3 and 4 cm, scale 1:200; in kind 6 and 8 m, diagonal 10 m |
| Area and perimeter | Selects two sides of the site, places it on a support, calculates the fence | Area 24 m², fence ≤ 20 m. Passable 4x6 and 6x4; 3x8 doesn't fit on fence |

For segments, the sum is checked separately on each span, and not just the total length. Different partitions and order of parts are accepted. The remaining options check lengths, directions, area, perimeter and forecast; a match with the sample picture is not required.

## Walkthrough and buttons

1. **Inspect.** The target, dimensions, supports A/B/C, saved hero and three previous pets are visible. "Select Plan" is available after loading the scene.
2. **Plan.** “Direct path A-B” or “Through support C”. The segments have one plan through C; The approaches to the support have already been built at the site.
3. **Construction.** Click material → start and end supports. The part is consumed after the second press. An unmatched pair of points does not consume the supply. “Rotate” sets the direction of the next part or changes the selected one. The installed part can be highlighted in the list. "Disconnect" returns the material. “Undo” and “Redo” save history of up to 40 changes. On a phone, selecting a material brings the map into the visible area; precise dragging is not required.
4. **Platform.** Select width and length → “Install at C”. A turn changes sides. The calculation uses the actual set rectangle.
5. **Prediction.** “Predict result” requires at least one part on each span/installed site. The student enters the number of meters. For triangle and scale, straight AB is predicted even if bypass is selected; for segments - the entire path; for the site - perimeter. "Return to Design" does not erase the design.
6. **Test.** An empty line, text, or a non-positive number are not considered a training attempt. An incorrect answer or geometry is saved in history with a reason. The direction error is separated from the calculation error. “Correct the design” returns all the parts to their places. “Show on Diagram” removes visual noise from the environment.
7. **Success.** “Lead the Team” appears after a successful challenge. The transition takes about seven seconds. The hero stops on the shore before the trailing pet; The result is shown after everyone has arrived. "Change Project" requires a new challenge.
8. **Result.** The number of tests, calculation errors and independence are visible. Help is not presented as an independent decision. “Continue at Home” opens three chapters with new dimensions; each has a separate save. "New Try" keeps the previous one in history and changes sizes.

“Scheme and Measurements” is enabled regardless of the stage. Three consecutive clues give the meaning of the property → formula → analysis of specific numbers. Any hint marks the passage as completed with help. A pure turning error is not considered a knowledge error.

“Reset design”, “Another path” and a new attempt require confirmation in a small window. Resetting and changing the path returns the materials, but retains tips and tutorial errors. Cancel in the window leaves the project.

Pause, Escape, leaving the tab, selecting a character and switching quality stop the transition. "Save and Exit" returns the profile. The restored unfinished mission opens on pause. The character profile is the same as previous games.

## DZ and tutor

DZ: `?topic=triangle&mode=homework&chapter=1`, then chapters 2 and 3. Dimensions increase, integer and solvable conditions are preserved. For a completed chapter, an achievement is recorded in the general profile; independence is recorded separately. This is a completion award, not a certification of topic mastery.

The disciple controls the entire mission. The tutor can guide her along the common screen: ask her to choose a path, explain the forecast, compare two constructions and discuss the specific reason for the error. There is no network second screen yet; Split drawing mode refers to stage 4. Setting and generating conditions through AI refers to stage 5.

## Implementation and preservation

- `lib/expedition/content.ts` — conditions, materials and three levels of tips.
- `lib/expedition/session.ts` - state transitions, mathematical checks, inventory, history and recovery.
- `construction-board.tsx` — mapped supports, textured details, and training measurements.
- `expedition-view.ts` - only the general GLB of the character and the previous pet sprites. The models and original motion cycles did not change.
- `expedition-game.tsx` — available buttons, stages, saving and result.

Save key `corgi.expedition.v1:<topic>:<home|lesson>:<chapter>`, previous attempts - suffix `:history` (up to 20). Details, directions, forecast, hints, undo/redo, tests and transition progress are saved. The save structure is checked before restoration. Skins are not cleared when replaying the game. Saves are local to the browser.

## Environment and interface

Visual support - coordinated base defense `../tower-defense/concept-reference-simplified-v2.png`: white tutorial panel on the left, green accent, island on top and a small hero with pets. In this mission, instead of combat targets, there are a river gorge and real construction points. Dimensions, buttons, text and validation remain code.

New images by ImageGen: `public/game-assets/expedition/gorge.webp` (431,714 bytes) and `wood.webp` (35,946 bytes). PNG originals are saved by the generator; the tree additionally lies in `wood-source.png`. WebP are obtained by compression/resizing only, without drawing on top of the generation. The bridge uses wood texture in scalable geometry; the layout, lines and supports are intentionally vectorial to combine mathematical coordinates and control.

Final gorge request: "Square 1024x1024 polished top-down 3D game art: a lush island river gorge. Two broad warm-gray rocky shores separated by clear turquoise water. Left shore at lower left, right shore at upper right; the water channel runs diagonally from upper left to lower right. Clean flat landing on left bank centered at 30% width, 68% height; landing on right bank at 60% width, 28% height. Small isolated round stone support island centered 60% width, 68% height. Wide EMPTY water corridors connect those three points. Leaves, shrubs and worn stone paths at outer edges, restrained detail, soft sun, rich natural textures, expressive premium mobile game look. No characters, text, symbols, UI, buildings, portals or towers.”

In the finished illustration, the fastenings are shifted 4% upward to match the surfaces of the banks; the 3:4 leg ratio is preserved. A separate complete UI concept was not received: repeated requests failed with a network error. Therefore, an exact match with the new agreed concept is not claimed; The user has not yet rated this new scene.

Low quality limits DPR to 1 and rendering to 30 fps, and disables anti-aliasing. In normal mode, DPR is not higher than 2. Map - static WebP; blur effects and heavy particles are not used. If the map is invisible, its WebGL rendering is skipped. There is handling for loss of WebGL context and reloading. The reduced animation takes into account the system setting.

## Draft boundaries

There are four study options and three numerical PD chapters for each. These are not new story locations for each chapter. Angles, features, volume, further islands, optional drag, networking, cloud saving and AI are not yet implemented. The test is mathematical, without a physical load simulator. Children's independent passage time and speed on a weak physical phone have not been measured.
