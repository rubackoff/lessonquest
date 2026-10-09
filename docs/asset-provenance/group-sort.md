# Origin of art kit `group-sort`

Build date: August 1, 2026.

## Sources and licenses

| Asset | Source | Right/License | Transformations |
| --- | --- | --- | --- |
| `background.png` | own generated `design-references/group-sort/classroom-background-plate-v1.png` | internal project asset | LANCZOS up to 1023×576, PNG optimize |
| `station-green/blue/gold` | built-in Codex ImageGen, style reference `group-sort-light-arcade-v2.png` | new generated project asset | chroma-key removal, despill, for blue edge-contract 1 px, resize, baked shadow, atlas |
| `tray`, `card`, `mascot-pedestal` | built-in Codex ImageGen, same style reference | new generated project asset | chroma-key removal, despill, resize, baked shadow, atlas |
| `motif-graph/atom/feather` | built-in Codex ImageGen, same style reference | new generated project asset | chroma-key removal, despill, resize, atlas |
| `particle-spark` | Kenney Particle Pack, `magic_05.png` | Creative Commons CC0 | resize 512→64, atlas; tint is used at runtime |
| `corgi-coach.png` | existing `public/corgi-coach-full-v3.png` | internal project asset | crop, resize 512×512, palette optimization |

Source CC0: `https://www.kenney.nl/assets/particle-pack`, archive version 1.0. External UI panels or other people's game art were not copied.

## Generation mode

All new raster assets are created by the built-in `image_gen`, not CLI/API. The reference was used only as a style/material/composition reference; pixels were not cut from it.

The general tail of the prompt contract:

```text
Use case: stylized-concept. Asset type: isolated casual educational game production sprite.
Match the reference's bright premium soft 3D material language: warm off-white pearl polymer/ceramic,
restrained teal/blue/amber enamel accents, frosted glass, coherent soft studio lighting.
Exactly one centered object, complete silhouette, generous padding, no text, no mascot, no room,
no extra objects. Perfectly flat solid #ff00ff chroma-key background, no gradient, texture, floor,
reflection, contact shadow or cast shadow; no magenta in the object. Avoid dark navy, purple, neon,
flat vector, thin outlines, cheap plastic, asymmetry and watermark.
```

Object prompt specifications:

- `station-green`: front-facing symmetrical tall rounded frosted-glass dome, substantial layered off-white podium, thick glossy teal-green rim, portrait 4:5.
- `station-blue`: precise edit of green station; preserve geometry/materials/framing, change only accent enamel and subtle glass tint to `#438DCD`.
- `station-gold`: precise edit of green station; preserve geometry/materials/framing, change only accent enamel and subtle glass tint to `#E3A333`.
- `tray`: one wide low empty recessed card tray, pearl body, silver bevel, restrained teal details, uniform stretchable middle, approximately 5:1.
- `card`: one empty front-facing 3:2 learning card, ivory face, pearlescent rim, stable identical corners and uniform NineSlice center.
- `motif-graph`: substantial beveled mint axes, one rising curve and exactly three data nodes, readable at 140 px.
- `motif-atom`: pearl nucleus, exactly three thick blue orbital rings and three electrons, readable at 140 px.
- `motif-feather`: one sculpted amber/gold quill with ivory shaft, diagonal square composition.
- `mascot-pedestal`: one low wide oval off-white pedestal with teal enamel rim and silver bevel; no corgi in source.

## Autonomous QA of assets

The check was performed by a separate vision judge according to two criteria: compliance with the reference style and cleanliness of the cut. Result after fixing blue edge:

- style match: `8.2–9.1/10`;
- cutout cleanliness: `8.9–9.5/10`;
- style unity of the entire set: `8.7/10`;
- all assets: pass.

## Assembly

- preparation: `scripts/build_group_sort_art.py`;
- packaging: `free-tex-packer-cli 0.3.0`, Phaser 3 export;
- JSON normalization: JSON hash for `Phaser.Loader.LoaderPlugin.atlas`;
- NineSlice frames are not trimmed or rotated, padding 4 px, extrude 2 px;
- final essential budget: 1,362,870 bytes (below desktop gate 1.5 MiB).
