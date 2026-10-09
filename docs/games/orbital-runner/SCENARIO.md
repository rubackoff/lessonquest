# Orbital Runner - Tutorial Template

The student is playing. During the lesson - a short start of three questions with a tutor, a guideline of 2-4 minutes with discussion. “Continue at Home” opens the remaining tasks through `?mode=homework&lesson=math`. The achievement “Knowledge in action” is given for mastering the entire home part, including corrected errors, and is visible in the office. The data is still local; opening skins is the next stage of the draft.

Continuous race around the orbital station. Three tracks correspond to three options; the answers themselves are written on the frames. The package is divided into three levels with changes in lighting, speed and obstacle placement. Mathematics, English and other subjects use the same mechanics and a replaceable set of tasks.

## Job cycle

1. **Read.** The character is standing, the question and three options are visible above the track. Reading time is unlimited. You can select a path in advance. The first screen allows you to turn obstacles on or off.
2. **Start the race.** A single start button starts the entire course. The distance between the frames is 40 m. The question remains visible; after each frame the next one appears immediately, the running does not stop.
3. **Complete the route.** Arrows/WASD, buttons or swipes change the path, enable jumping and sliding. You need to jump over a low barrier, slip under a beam, and go around a box. Each row has a free lane. The last 16 m are clear of obstacles to calmly take the answer track.
4. **Respond with movement.** At the beacon, the actual position of the hero is taken into account. A late request to change lanes does not transfer the character instantly. The option button only guides the hero; by itself it does not count as an answer.
5. **Get feedback on the go.** Correct answer counts immediately. A wrong frame takes one life; a brief explanation is visible for three seconds without stopping movement. Errors in tasks are counted separately from collisions.
6. **Summarize.** After the last frame or loss of three lives, correct answers, collisions, coins and distance are shown. “Repeat mistakes” creates a new race only from incorrectly solved tasks.

On impact, one of three lives is lost, then there is a short protection against re-hit. A wrong answer also takes a life, regardless of protection from obstacles. Pausing, leaving the tab, and opening character selection stops the movement.

The “Light Graphics” mode is common to three games and the profile, and is stored in the browser. On phones and devices with four or fewer logical cores, enabled by default: DPR no more than 1, no dynamic shadows, up to 30 frames/s. HTML texts and buttons maintain screen resolution. Changing graphics does not reset tasks and health.

## Educational and game assessment

- Correct answers are stored separately from collisions and coins.
- Coins provide an additional movement goal; their location does not indicate the correct answer.
- While running, the options do not highlight the correct ones. Checking takes place only at the lighthouse.
- The number of sections is determined by the actual number of input tasks; the set is not padded with repetitions to a fixed length.

## Input data

Component `OrbitalRunnerGame` accepts `lessons: readonly RunnerLesson[]` and optional `settings: RunnerSettings`. `RunnerLesson` and `MazeLesson` use a generic type `LearningGameLesson`; packages for both games are verified via `lib/learning-game-content.ts`. For three tracks in each task, exactly three non-empty text options are needed. The index of the correct answer starts from zero. Job IDs must be non-empty and unique in the set.

```json
{
  "id": "multiplication",
  "title": "Multiplication table",
  "questions": [
    {
      "id": "multiply-7-8",
      "prompt": "What is 7 × 8?",
      "options": ["54", "56", "64"],
      "correctIndex": 1,
      "explanation": "7 × 8 = 56. You can calculate it like this: 70 − 14."
    }
  ]
}
```

Settings: `{ "obstacles": true, "pace": "calm" }`. `obstacles: false` leaves the choice of answer and collection of coins; `pace: "normal"` speeds up movement. Quiet mode is the default. Images from Extended `QuizQuestion` this template does not display yet.

Such a package can be passed from future tutor setup or AI task generation. Demo page `/lab/orbital-runner` transfers already existing subject sets of the labyrinth. They use a common format `QuizQuestion`, so the learning content is separated from the game scene.

## Implementation

- `lib/orbital-runner/session.ts` - checking tasks, route, states, movement, collisions and answer results.
- `components/games/orbital-runner/orbital-runner-game.tsx` — questions, management, analysis and repetition of errors.
- `components/games/orbital-runner/runner-view.ts` — three-dimensional scene and beacons.
- The characters and saved skin choices are shared with the labyrinth. Jumping and sliding are superimposed on the existing skeleton; approved models and running animations are saved.
- Visual reference: `concept-educational-v2.png`. `concept-v1.png` saved as an early sketch until the training scenario was finalized.
