# “Couples”: a visual task for a desktop layout

## Purpose

A highly detailed UI concept for a student game screen. This is a visual reference for subsequent layout, and not the final bitmap asset.

## Direction

An easy modern educational game in the style of the existing LessonQuest. Light and airy stage, tactile white cards, soft depth, confident rounded typography, turquoise blue main accent, warm corgi detailing and calm green success. In terms of quality, it’s a current polished web game: more fun than an adult SaaS, but without school clipart and overloaded children’s graphics.

## Composition

- landscape 16:10;
- full-screen student player without Studio and browser frame;
- compact overhead HUD;
- title “Gather Pairs”;
- instruction “Connect the phrase with its meaning”;
- two columns of four cards;
- the center is left to the lines;
- one turquoise blue line is in the process of connecting;
- one green line has already been confirmed;
- small progress “2 out of 4”;
- below, an existing corgi coach in a turquoise hoodie shows a connection gesture and gives a short hint about drag or tap;
- no side panels or leaderboards; The corgi is a functional coach, not a casual decoration.

## Content

Left column:

1. meet the deadline
2. push the meeting back
3. keep me posted
4. wrap things up

Right column:

1. keep me updated
2. finish and summarize
3. meet the deadline
4. reschedule the meeting for a later time

## Invariants for implementation

- light background `#F4F8FA`;
- white cards with a radius of about 22 px;
- main text `#172033`;
- primary `#0CA6A3`, secondary `#1768DF`, spot warm `#FF9B52`;
- success `#22A06B`;
- calm thin boundaries;
- clear magnetic knots on the inner edges of the cards;
- minimum 18 px for card text;
- the interaction should be obvious without much training.

## Avoid

- Wordwall-like dark polygon;
- black HUD;
- acid neon;
- low contrast glass panels;
- any characters other than the existing corgi coach from the project;
- excessive number of metrics;
- small text;
- editor layout instead of the game;
- logos, watermark and browser frame.

## Generated version v1 - direction rejected

File: [`mockup-desktop-v1.png`](./mockup-desktop-v1.png), 1568 × 1003 px.

The layout is created by the built-in image generation as `ui-mockup` according to the first version of the visual task.

Checking the result:

- full-screen game scene without Studio elements;
- the light basic system and the specified violet-blue palette are observed;
- four pairs, magnetic nodes and two bonds in different states are visible;
- adult Business English content is readable and does not look childish;
- The HUD is visually secondary to the mission;
- there are no characters, clipart, leaderboard, dark polygon and extra panels;
- all required Russian and English inscriptions are displayed correctly;
- the composition can be reproduced by native DOM/CSS components.

A slight difference from the task: the active purple line in the static frame looks almost confirmed. When implemented, its state will differ in the raising of the original card, the empty receiving node and the movement of the free end.

According to feedback, the option is too mature and neutral: it lacks the character of the existing LessonQuest. It is saved only as a history of the direction and is not used as an implementation goal.

## Requirement for option v2

Option v2 is created with real assets `public/corgi-logo-concept.png` and `public/corgi-dog-cutout-v2.png` as visual references. It should keep the simplicity of v1's game composition, but return:

- signature turquoise color of the hoodie;
- warm orange corgi personality;
- more lively shapes and rounded typography;
- corgi coach as a functional cue;
- balance between childish energy, teenage modernity and adult readability.

## Generated version v2 - style check

File: [`mockup-desktop-v2-draft.png`](./mockup-desktop-v2-draft.png), 1586 × 992 px.

What's fixed regarding v1:

- a recognizable corgi from an existing project was used;
- branded turquoise, blue and warm orange have been returned;
- the background, progress and forms became more vivid;
- the hint is built into the corgi's response;
- the screen retains clear mechanics and an adult tutorial, but no longer looks like a SaaS dashboard.

This file currently has the status of **style draft**, and not the final layout of the mechanics. The generator erroneously showed a green confirmed connection `meet the deadline → keep me updated`. Correct connection - `meet the deadline → meet the deadline`. Two attempts at spot editing did not return a corrected file: the first froze, the second ended with an external error 403. Therefore, the picture is used only for choosing character and composition, but not as a literal source of correct answers.

Before layout, the green line route must be corrected in the approved layout or directly specified by deterministic coordinates in the DOM/SVG prototype. Incorrect matches are not carried over into the game.

## Generated mobile version v1

File: [`mockup-mobile-v1.png`](./mockup-mobile-v1.png), 853 × 1844 px.

The layout was created by built-in image generation with real corgi assets of the project. It captures the direction of the mobile Focus mode: one large initial phrase, four responses, a calm signature palette, a clear correct answer and a small corgi coach.

The height of the image is larger than the actual viewport and is used as a compositional reference rather than a literal layout. The implemented screen for 390 × 844 compacts vertical intervals and preserves large click zones.

## Transferring direction to code

The layout implements the approved features of v2 and mobile v1: a light turquoise-blue scene, large white cards, magnetic nodes, a functional corgi coach and a minimal HUD. The training matches are taken from the game data, so the erroneous desktop style draft line did not end up in the renderer.

Actual QA shots:

- [`match-pairs-desktop-correct.png`](../../../output/playwright/match-pairs-desktop-correct.png);
- [`match-pairs-desktop-wrong.png`](../../../output/playwright/match-pairs-desktop-wrong.png);
- [`match-pairs-desktop-complete.png`](../../../output/playwright/match-pairs-desktop-complete.png);
- [`match-pairs-mobile-ready.png`](../../../output/playwright/match-pairs-mobile-ready.png).
