# Base defense - educational tower defense

The first stage was implemented on October 8, 2026. The target mechanics are described in the [island games specifications](../../ISLAND_GAMES_SPEC.md), the queue - in the [plan](../../ISLAND_GAMES_IMPLEMENTATION_PLAN.md). This document describes the actual rules of the current draft.

Draft for user clarification: first the training mechanics, then the game. The student plays; the tutor helps with explanations. The editor and AI connection are not included in this stage.

## Educational mechanics

The goal of the first packet is multiplication by 7: find the product, recover the multiplier, apply the same skill in a short problem. Three waves, before each two tasks: a total of six main tasks, a guideline of 3–5 minutes, taking into account the student’s pace. Major improvements without a timer; During the wave, recharging is available for answering in 12 seconds.

There are two sets at the start. Construction and each level of improvement costs one set. The student selects a type and one of six sites; You can build several identical towers. Rearranging is free, deleting returns the included sets, replacing the type returns the cost of improvements and resets the battery. During the wave, construction is closed. The highlight shows the range, the priority switches between the closest to the base and the largest target.

The towers start out without energy. The correct main task gives the selected tower 60 energy (maximum 100) and one set. There is no passive recovery or free charge between waves. A laser shot costs 12, cryo costs 15, and impulse costs 25. The laser does 2/3/4 damage; cryo deals 1 damage and slows for 2.8/3.6/4.4 seconds; the impulse deals 2 damage to a group within a radius of 1.8/2.2/2.6. The maximum level is third.

“Charge +60” opens an additional task. In practice there are 12 seconds, the wave moves at a speed of 35%; in quiet mode, the wave and timer are stopped. The incorrect option is disabled without reward; you can continue or open the analysis. After parsing, a similar task is shown. After the time has expired, a new task and analysis are available. If the wave ends during the response, the task remains available without a timer. Recharges and assistance are counted separately from the six main tasks.

Enemies are simple bubbles of three colors and sizes. Small ones are faster, larger ones are slower and stronger. Bubble graphics - inexpensive spheres, no need to load the old alien sprite.

The student selects a tower to prepare, solves the problem, and then spends the resulting set himself. Pressing it again does not give a double reward. An error or hint opens an analysis and a new similar task; the result is marked as completed with. Independence is separate from game completion and is not a diagnosis of mastering the entire topic.

Two confirmed major decisions open the launch of the wave. The base has 100 durability; missed small, medium and large bubbles remove 5, 9 and 18 respectively. Zero strength stops the game. Repeating the last wave returns its original strength and batteries, saves training results and gives new charging options. The setup can be changed before repeating.

The hero in the saved skin and three pets are at the base. “Cover Base” prevents damage once per wave for five seconds of game time; The cosmetic skin does not affect the effect. The original models and animations have been preserved. During preparation, the battle was stopped; During charging, the student sees the effect of the energy received.

## Continued

Four ready-made packages are available: Multiply by 7, Short Linear Equations, Fractions and Fractions, Present Simple with he/she/it. Five wave compositions: “First Watch”, “Rapid Flow”, “Dense Wave”, “Big Bubble”, “Night Watch”. These are ready-made scenarios and algorithmic versions of numbers; AI is not connected yet.

The DZ consists of three separate chapters with modified tasks. Each topic, mission, lesson/DZ mode and chapter has its own save point. The state is saved after actions and once per second; exiting and hiding the tab pauses the game. After returning you need to obviously continue. The new attempt saves the previous one in the local history (the last 20 for this scenario). An existing achievement is awarded for a completed chapter; the discovery of cosmetics remains a future stage.

## Check

- New kits are issued only for solved main tasks, in addition to the two starting ones. The improvement writes off the kit once.
- The error/hint requires a new similar task, and the first result is not overwritten.
- During the training part and pause, the battle does not change state.
- Each of the three towers affects the battle differently; the established levels remain between waves.
- The results show six completed tasks, independent answers and tasks after analysis.
- Going to the DM creates a new round; The local achievement appears in the profile.

## Visual implementation of the draft

Based on an illustrative reference provided by the user, then its version `concept-reference-simplified-v2.png`. The final version uses a separate environment image, transparent tower images, geometry bubbles, saved character GLB and existing pets.

For weak phones, the general “Light Graphics” mode: DPR ≤ 1, up to 30 fps. When the map is off screen, it is skipped, but the wave and timer continue to run. On the phone, the charging question appears at the top of the bottom of the screen, without scrolling to the timer.

According to the following clarification from the user, the towers, portal, base and characters are reduced relative to the map. The vacated space is occupied by a long path with four smooth turns. The movement of enemies follows its middle along measured curves, and shots are aimed at the real positions of the targets.

This is a 2.5D scene with a fixed top view. The environment is static, towers have separate levels, highlight and recoil, enemies move and slow down, shots are generated by code. The hero himself remains the original 3D model with a change of skin. The interface, tasks, answers, check, pause and counters are native elements of the application.

## Compliance check

- The stone environment, water, portal and energy base from the reference are preserved.
- The panel and arena use the same images of the three towers.
- The white training panel, green buttons and a large task with three answers are retained.
- The size of game objects has been reduced, the route has been lengthened at the direct request of the user.
- Texts and progress correspond to working teaching mechanics; the erroneous option 48 from the picture is replaced by a calculated distractor answer.
- Current stage tested via Playwright at 1440x960, 390x844 and 360x800; Browser plugin is not available. Full pass made on desktop and mobile emulation. The test was not carried out on a weak physical phone. New snapshots and team results are listed in the implementation plan.
