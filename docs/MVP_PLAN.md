# LessonQuest: MVP Plan

Current development queue as of October 8, 2026: [four island games](ISLAND_GAMES_IMPLEMENTATION_PLAN.md). Detailed agreed upon mechanics and scenarios: [game specification](ISLAND_GAMES_SPEC.md). Below is the original training plan for the MVP.

## Observations from reference

- The simulator page should open the practice itself right away: a large example, input in numbers, points, series, record, progress and settings nearby.
- Entering a response does not require Enter. For a multi-digit answer, the numbers are accumulated and the answer is accepted immediately after a match.
- Space or the "I don't know" button shows the correct answer and moves to the next question.
- There are two timers: a general training timer and a time limit for one question.
- The settings should be next to the exercise: duration, time per question, sound, on-screen keyboard, question options.
- The catalog is organized by subject, grade and topic. In junior mathematics the core is: addition, subtraction, multiplication tables, division. Negative numbers and fractions appear in 6th grade. For physics, formula simulators are the first to use.

## First vertical cut

1. Catalog of local templates: mathematics and physics, classes, complexity, cards.
2. Universal numeric drill engine: question generation, string answer, auto-check by prefix.
3. Practice without Enter: keyboard, mobile on-screen keyboard, Backspace, minus and slash.
4. Game metrics: points, correct answers, streak, multiplier, localStorage record, errors.
5. Workout settings: duration, time per question, negative numbers for suitable simulators.
6. Visual style: clean work interface, corgi coach, soft colors, smooth states.

## Expansion after MVP

1. Teacher mode: create a template, select ranges, save a link for the student.
2. Packages of simulators on the topics: arithmetic, fractions, algebra, geometry, kinematics, electricity.
3. Student reports: speed of response, weak types of examples, dynamics of errors.
4. Wordwall-like templates: matching, sorting, quiz, missing number, formula cards, graph builder.
5. Import tasks from CSV/Google Sheets and quick homework assignments for your tutor.
6. Accounts, classes, progress and payments only after checking the learning mechanics in your classes.
