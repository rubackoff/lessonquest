# Forest camp - working sketch

Archive of the previous draft. It has been replaced by [“Character Heist”](../character-heist/SCENARIO.md); the old URL redirects to the new game.

The student always plays. The tutor chooses a topic, observes and helps to sort out mistakes. The lesson has three tasks, a guideline of 2–4 minutes with discussion. After the result, you can move on to the remaining tasks as work assignments. There is no time limit for reading.

## Cycle

1. Read the question and three options. The hero and the timer stand until “Start Sortie”.
2. Approach the load A/B/C, take it via the E/button and bring it to the fire. Controls: WASD/arrows, buttons or gesture on the field. You can change the cargo before delivery.
3. The delivered version is checked by the fire. The correct answer is two units of firewood; incorrect - explanation and task for repetition. The game is waiting for parsing to complete.
4. After three questions - preparation for the night. Shelter costs two units and reduces nightly consumption by one. The purchase saves the fire reserve. If there is not enough wood, the student repeats only the unmastered questions of the day.
5. The night takes six seconds of active time, fuel is written off once. In short mode, then the results and exit. The DD contains the following groups of questions; the latter incomplete group requires less fuel.

Reading, reviewing, preparing, wardrobe, pause and hidden tab stop the timer. A mastered question provides a resource once. The error does not destroy the camp.

## Data and continuation

`ForestCampGame` accepts `lessons: readonly LearningGameLesson[]`, `homework?: boolean`. Assignment: `id`, `prompt`, three `options`, `correctIndex`, `explanation`. General function `learningGameQuestions` selects the first three for the lesson, the rest for the learning task. This is the same package as the maze and runner; text tasks do not depend on the location of the cargo.

Lesson: `/lab/forest-camp`. DZ: `/lab/forest-camp?mode=homework&lesson=math`. The demo contains 3 questions for the start and 7 for the remote control. The long part is optional.

“Knowledge in action” is awarded for mastering each DS question. Repetitions of one task and time in the game do not replace knowledge. Fixes can be collected in a few attempts. Repeated issuance for the same material and template is excluded. Achievements are stored locally in the browser and are visible in the account; accounts and synchronization have not yet been done. A stable achievement ID is ready for the future discovery of skins, the discovery itself is the next stage.

## Source of idea and status

Landmark - [99 Nights in the Forest](https://www.roblox.com/games/79546208627805/99-Nights-in-the-Forest): camp, forays, development, night. [Official API](https://games.roblox.com/v1/games?universeIds=7326934954) when researched on October 7, 2026, gave 145,770 concurrent players; it is a changing slice. Training loads, reserve, duration and rewards are our adaptation. The map, monsters, interface and assets of the original are not copied.

General GLB and hero animations have been retained. `concept-v1.png` — work direction; the outline prioritizes the learning cycle and duration. Fine polishing and skin unlocking have been delayed.
