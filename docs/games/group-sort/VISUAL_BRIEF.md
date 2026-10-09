# "Groups": visual direction

## Status

The main implementation target is `design-references/group-sort/group-sort-light-arcade-v2.png`. This is a light Corgi Classic theme without a dark system header and without water. `mockup-desktop-v1.png` remains a reference only for the separate world “Underwater World”.

The product scene uses an approved `public/corgi-coach-full-v3.png`: natural sitting posture, normal number of paws, calm facial expressions. The character is not regenerated for each topic, but rather receives states through pose, local movement, light, and lines.

## Scene invariants

- thin light HUD with title, instructions and progress;
- one row of large, dragged cards on a conveyor; on a narrow screen - horizontal snap-scroll;
- three spacious destination stations with physical platforms and individual markers;
- corgi works as a prompt for action, and not as random decoration;
- the background changes theme, but the geometry, contrast and mechanics remain the same;
- Tutor images are displayed inside cards without cropping.

## Motion spec

### Peace

- stations breathe light with an amplitude of no more `2%` and period `3.2–4.2 s`;
- the conveyor is almost motionless: only a weak travelling highlight;
- cards cascade in `40–55 ms`;
- Corgi does one unobtrusive idle cycle once every `3.5–5 s`.

### Grab and carry

- card for `140 ms` rises to `scale 1.045`, gets one slope from the speed and moves to the top display list;
- Phaser draws a curved magnetic trail from the source slot to the card;
- the nearest station raises the platform to `6–10 px`, expands the ring by `3–5%` and changes the caption to “Release here”;
- the remaining cards reduce contrast, but do not change positions during drag.

### Correct station

- card for `220–300 ms` passes the magnetic snap to the center of the platform;
- platform does `squash 0.97 → 1.025 → 1`;
- one pooled ParticleEmitter releases `8–14` own particles;
- after settling, the card is reduced to a compact placed state, and only then the conveyor closes the free space;
- green means a confirmed result, turquoise does not replace success.

### Error

- the station gives local recoil without camera shake;
- coral outline visible `180–260 ms`;
- the card returns in an arc maintaining the initial speed and soft `Back.Out`/damped spring;
- the order of the remaining cards does not change so as not to break spatial memory.

### Reduced motion

Trail, particles, idle ripple and overshoot are disabled. The target highlight, final position, icon and result text are saved.

## Implementation

Production renderer: `components/games/group-sort/`. It is connected to Student, Studio and Editor and retains the same props/content contract. `components/group-sort-canvas.tsx` temporarily remains only a rollback copy until visual confirmation and the final acceptance gate.

- DOM: cards, text, formulas, images, focus and keyboard fallback;
- Phaser 4.2.1: stations, platforms, ambience, trail, particles and feedback choreography;
- bridge: pointer bounds, selected card, active station, correct/wrong/complete;
- scale: `Phaser.Scale.RESIZE`so that the Phaser coordinates match the DOM pixel-for-pixel.

Technical sources: [Drop Zone](https://labs.phaser.io/view.html?src=src%2Finput%2Fzones%2Fdrop%20zone.js), [Elasticity](https://labs.phaser.io/view.html?src=src%2Ftweens%2Felasticity.js), [Explode Emitter](https://labs.phaser.io/view.html?src=src%2Fgame%20objects%2Fparticle%20emitter%2Fexplode%20emitter.js), [Sparkle Trail](https://labs.phaser.io/view.html?src=src%2Fpaths%2Ffollowers%2Fsparkle%20trail.js).
