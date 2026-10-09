# "Groups" - light arcade game

![Current reference](./group-sort-light-arcade-v2.png)

`group-sort-light-arcade-v2.png` — current implementation target. `v1` remains a historical option and is not used for pixel-comparison.

`classroom-background-plate-v1.png` — a separate empty art base without content and UI. Runtime uses it via `public/theme-classroom-light-v1.png`, so formulas, captions, stations, cards and tutor images remain dynamic.

## Mechanics

The player takes a large card from the lower conveyor and transfers it to one of three themed stations. The active station reacts magnetically to approach. The correct card is gently pulled in; the erroneous one receives a short coral impulse and springs back.

## Composition

- a light thin hat with only the name, instructions and progress;
- three large collection stations instead of dotted rectangular zones;
- one row of large cards on a physical conveyor;
- the dragged card is always above the other layers;
- the corgi occupies a separate safe area on the left and reacts to the result;
- no side editor panels inside the game screen.

## Content slots

The geometry of the card does not depend on the subject. The same card supports:

- short or long text;
- mathematical formula;
- SVG chart or graph;
- image uploaded by the tutor;
- audio with available text caption.

The text and media-slot remain a DOM layer. Phaser draws the world, light, magnetic trail, particles and staged reactions of stations.

## Palette

- background: `#F7FBFA`, `#EFF8F6`;
- text: `#172033`;
- action: `#0CA6A3`;
- success: `#15945B`;
- error: `#F07D68`;
- cards: white with a thin gray-turquoise border.

## Prohibitions

- dark hat;
- dark green shell;
- underwater background;
- fine mesh;
- dotted empty containers;
- identical cards without depth;
- extra paws or a glossy “AI” corgi;
- transferring the current Canvas one to one without restructuring the composition.

## Implementation status

Hybrid Phaser renderer `v2` assembled and connected in all three screens. The browser has been checked for rest, false return, correct station, desktop/mobile layout, single Phaser canvas and clean console. Until legacy-renderer is removed, the custom visual confirmation, physical touch-device, media-card, and reduced-motion smoke remain.
