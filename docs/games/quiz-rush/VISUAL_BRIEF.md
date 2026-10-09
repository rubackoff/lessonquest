# “Blitz quiz”: visual direction

## Status

`mockup-desktop-v1.png` - a reference for the “Underwater World” theme option, and not a mandatory background for the quiz. Only the HUD hierarchy → question → answers → feedback is transferred from it. The default is light Corgi Classic; the rest of the worlds are chosen by the tutor.

A full-figure character from a bitmap layout was rejected due to unnatural anatomy. The implementation uses a compact branded head without limbs and does not reserve a separate column for it.

## Scene invariants

- full-width HUD with item and compact progress;
- the question is the main object and is placed on a large tactile board;
- responses look like game cards rather than web form fields;
- with three options, the last answer takes up a separate wide line and leaves room for the coach;
- Correct and incorrect answers are given a color, icon and explanation;
- images of the question and options maintain proportions and do not break the grid;
- the mobile version goes into one column without small click targets.

## Implementation

Main renderer: `components/quiz-rush-stage.tsx`; the final composition rules are at the end `app/lab.css`.
