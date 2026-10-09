# Laboratory mechanics

Current user priority, 10/08/2026: make more games with a simplified appearance in order to select interesting ones for further development. Clarification: these are complete game scenarios and mechanics, not empty button demos. Page `/lab/mechanics`.

## First batch

| Game | Scenario and three stages | Actions and Choices | Limitation and Failure | Educational purpose |
| --- | --- | --- | --- | --- |
| Equation scales | Delivery to the lighthouse: lower platform → oncoming cargo → sensor calibration | Apply operations to both parts, choose order, undo | 3 / 3 / 4 actions per launch; when exhausted, you need to remove unnecessary actions, canceling returns the charge | Equivalent transformations, variable in both parts |
| Function Machine | Restore communication: first signal → remove offset → economy mode | Assemble, rearrange and disassemble the chain; launch three inputs at once | 2 / 2 / 3 slots, each module once; you can see the transformation of each signal at each step | Order of Operations and Linear Relationship for Multiple Inputs |
| Two spans | Expedition: road to the river → washed out area → last crossing | Select span, distribute total stock, return part, cancel move | Two pieces of each length, total limit of 4 / 4 / 5 pieces; every span and margin is checked | Composition of lengths, limited resources, multiple feasible solutions |
| Platform and fence | General camp → nursery → reserve warehouse | Add/remove cells, change shape, predict border length | Given area, connected by sides, limited perimeter; bad shape remains for rework | Difference between area and perimeter, internal and external sides |
| Bureau of Investigation | Parcel L7 → missing key → change of plans | Select source and question, read answer, retain facts, connect two pieces of evidence to conclusion | Similar items, different times, old information; no correct conclusion without two reasons | Reading A2-B1, Temporal and Conditional Relationships, Inferring from Sources |
| Order Manager | Check-in → lunch shift → delivery windows | Read requests, allocate shared resources, revise overall plan | Each resource is available once; locally convenient choice may leave another client without a suitable option | English restrictions, before/after/at most, agreement of several conditions |
| Guide and Explorer | First connection → long wall → bypass of dead end | The tutor describes the hidden card; the student asks, composes, replaces commands and checks the route | Up to 8 steps, obstacles and border; execution stops at the first obstacle, the program remains | Coordinates, planning, spatial English, meaningful cooperation |
| Find the breakdown | Incorrect hyphenation → hidden parenthesis → last step | Find the first incorrect transition, write down an equivalent correction, recalculate the total | A subsequent error may be a consequence of an earlier one; the correct final number is not enough | Checking the reasoning and restoring the solution |

Each stage has an introductory situation, an ongoing constraint, and a story outcome associated with a successful check. The next stage opens after the previous one, changes the conditions and requires a new solution. The old steps can be repeated in a different way. The graphical world is not simulated: simple fields show real intermediate results of actions.

## Prototype review cycle

1. Select a game from the catalog. It shows the subject, the audience, the action and the stages completed.
2. Read the situation and goal. The student performs the actions rather than watching the auto-progress.
3. Check the plan. The error shows a specific discrepancy and leaves the project in place.
4. Open a hint if necessary. The result screen shows whether there was help; This is not a diagnosis of independent mastery of the topic.
5. Complete a stage, continue the story, or try another way.
6. Check “develop / redo / postpone” and write down the reason. Assess interest in the solution and desire to continue, not appearance.

Reviews and a list of completed stages are stored under a separate key `corgi.mechanics-lab.v1`. An unfinished construction is reset when you exit the game - this is clearly written in the catalog. Previous game saves and character profiles are not changed. There are no new achievements for these diagnostic tests.

The shared route works on one device with a role change. The tutor shows the student only his screen and conveys information in words; This is a physical agreement, not an access control system. There is no network room or second device yet.

## What we find interesting

After the actual passage, we look at whether the student understood the goal; whether you made a meaningful choice; could you explain the error? did you want to go through the next stage; whether the game task helped the action being studied. These answers are provided by the observation and commentary of the tester, not by an automatic rating.

The prototypes so far contain prepared tasks. AI, teacher customization, new characters, images and graphical polish are not needed for the current review. For grades 9–11, the algebraic error laboratory currently demonstrates mechanics with basic content, rather than offering a full-fledged examination course.

## Validation and expansion

Mathematics and terms are separated in `lib/mechanics-lab.ts`; minigames use these checks directly. Alternate solutions, unacceptable margin, perimeter and connectivity, sufficiency of evidence, assignment conflict, route collisions, corrected equality equivalence are checked.

After the user test, we select the next batch from the remaining scenarios: mirrors and angles, graphs and motion, fractional recipes, proofs, budget planning, timeline restoration, information gap dialogue, coordinate map, sweeps, logical switches, grammatical story assembly and comparison of strategies. This is a queue of candidates, not already made games.

Verified 10/08/2026: all 24 stages via real buttons in Playwright, 1440x1000; bugs and fixes for scales, machine and route; saving eight reviews and progress after reboot. In mobile emulation 390x844 the site and investigation were completed, 360x800 - orders. No horizontal overflow or application errors were detected in the console. Browser plugin not available; previous IAB attempt on this local address returned `ERR_BLOCKED_BY_CLIENT`, so Playwright was used.

`npm test` — 271 tests in 28 files (21 checks of the new laboratory); lint and TypeScript are successful, the production build is completed. In production, passing a car with a hint, restoring feedback and changing the role by 360 px were separately tested. The new lab does not have canvas, WebGL, images or 3D models. The physical weak phone, Safari and the interest of real students have not yet been tested.

Launch: `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 3000`. Local version available at `http://127.0.0.1:3000/lab/mechanics`. The directory is also associated with the profile. The saved verification images are located outside the repository: `C:/Users/rubac/AppData/Local/Temp/mechanics-qa/final-machine.png` and `final-route-mobile.png`.
