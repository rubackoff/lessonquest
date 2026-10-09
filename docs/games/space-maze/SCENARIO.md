# Space Maze - Educational Template

The student is playing. During the lesson - a short start of three questions with a tutor, a guideline of 2-4 minutes with discussion. "Continue at Home" opens remaining questions through `?mode=homework&lesson=math`. For mastering remote control, you are awarded a local achievement “Knowledge in action”, visible in the office. Unlocking skins is the next step. This is a sketch without synchronization between devices.

Scenario: the hero explores the orbital station and reaches a beacon that corresponds to the answer to the training task. Three A/B/C beacons are associated with three text options. The item and questions are conveyed separately from the map, character, and controls.

## Job cycle

1. **Read.** The question and options are visible, the hero and the aliens are standing. There is no time limit for reading. Movement begins only by pressing the “Go” button or an explicit start command; arrows and dragging the field to the start do not start the level.
2. **Select a route.** The student goes to the response beacon using arrows/WASD, buttons or a virtual joystick on the field. A short press completes one step, a hold continues the movement; reversal also works between cells. There is a path to each beacon that does not require going through other answers.
3. **Reply with a visit.** The answer is counted upon actual arrival at the beacon cell. The options below serve as a legend; they are not responsible for the student and do not highlight correctness in advance.
4. **Disassemble.** The track stops and an explanation and the correct option are shown. If you answer incorrectly, the error counter increases and lives are saved. “Try again” returns the hero to the start of the same task and again waits for the reading and the “Go” button.
5. **Continue.** After the correct answer, the button opens the next failed task. Each new map again awaits a clear start. The number of tasks is taken from the input set.
6. **Repeat the difficult ones.** The results appear after passing all the questions: answers on the first try, errors, movement and collision times. “Repeat mistakes” creates an activity only from tasks where there were incorrect attempts. The New Expedition brings back the full original set.

If a different task number is selected before starting, the results of those already completed are saved. After the end of the list, the route returns to the missed tasks. The very fact of completing the last issue does not complete the incomplete lesson.

## Game complication

Aliens can be disabled on the first screen. Without them, the map, answer choice and knowledge test remain. An encounter with aliens takes away one of three lives and returns the hero to the start with a short defense. If you lose all lives, you can repeat the current level. Lives and encounters measure the progress of the map; Errors in answers are taken into account separately.

The card is determined by the task number, not the correct answer option. The first ten cards are saved. For longer sets, new cards are generated; The maximum size and speed of opponents are limited to difficulty level 10. The timer only records active movement. Pause, reading, parsing, hidden tab and character selection stop the game time.

## Input data

`SpaceMazeGame` accepts `lessons: readonly MazeLesson[]` and optional `settings: { enemies: boolean }`. `MazeLesson` and `RunnerLesson` use a generic type `LearningGameLesson` from `lib/learning-game-content.ts`.

```json
{
  "id": "english-replies",
  "title": "English: dialogues",
  "questions": [
    {
      "id": "give-passport",
      "prompt": "The employee asks to show your passport. What should I answer?",
      "options": ["Here you are.", "Never mind.", "It is up to you."],
      "correctIndex": 0,
      "explanation": "Here you are is used when passing an object or document to a person."
    }
  ]
}
```

The set must be non-empty. Job IDs are unique; the question and each of the three options are non-empty; `correctIndex` — an integer from 0 to 2. One package of tasks can be transferred to the maze and runner. AI generation and tutor setup will be able to provide this format. The current template shows text assignments; images from extended `QuizQuestion` are not displayed.

Demo questions are connected on the page `app/lab/space-maze/page.tsx`. The game component itself does not select the built-in item catalog. The length of the lesson is not limited to ten questions and short sets are not supplemented by repetitions.

## Mechanics files

- `lib/learning-game-content.ts` — general format and verification of the training package.
- `lib/space-maze/session.ts` - movement, visiting lighthouses, stopping for analysis and collisions.
- `lib/space-maze/maze.ts` — passable map and enemy behavior.
- `components/games/space-maze/space-maze-game.tsx` - reading, transitions through tasks, summaries and repetition of errors.

The hero's appearance and movement use existing general models. This revision changes the learning cycle, not the visual direction of the station.
