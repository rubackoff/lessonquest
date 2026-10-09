# Lightweight exercise equipment: current status and filling plan

## Why is this a separate layer?

Easy simulators and game templates solve different problems:

- the simulator gives short intensive practice of one skill and generates the next variation;
- the game template receives ready-made tutor content and displays it as pairs, sorting, quiz or other game;
- the same training skill can use both modes over time, but their runtimes and editors should not be mixed.

The public catalog of [Obrazavr](https://obrazavr.ru/trenazhyory/) is used as a product reference for covering school topics and short training cycles. LessonQuest's content, language, explanations and visuals are created independently.

## What has been implemented now

There are 21 work simulators in the catalog:

| Subject | Quantity | Topics |
| --- | ---: | --- |
| Mathematics | 12 | addition, subtraction, multiplication, division, remainder, perimeter and area, powers, negative numbers, reducing fractions, GCD, LCM |
| Physics | 3 | speed, density, Ohm's law |
| Russian language | 3 | vowels and consonants, -tsya/-tsya, stress norms |
| English | 3 | prepositions of place, Present Simple / Present Continuous, irregular verbs |

The engine supports:

- numeric answer, negative numbers and fractional line;
- choosing one answer from 2–4 options;
- mouse, touch, numeric keypad and keys 1–4;
- instant check, correct explanation, “I don’t know” button;
- general timer, 5–30 second limit per question, points, series, record and list of errors;
- filtering by subject and class;
- single calm interface with turquoise action, green success and coral error.

## The following universal mechanics

Adding hundreds of topics one at a time until common mechanics appear is ineffective. Runtime extension order:

1. **Enter a word or short phrase.** Case normalization, `y/e`, spaces and valid answer options.
2. **Assembling a sequence.** Letters of the alphabet, words of a sentence, stages of a process, chronology.
3. **Several omissions.** Endings, prefixes, verb forms, formulas and units of measurement.
4. **Distribution by category.** Parts of speech, living/non-living, substances, eras, types of quantities.
5. **Interactive diagram.** Points on the coordinate plane, angles, graphs, chains and maps.
6. **Independent reading.** Word/phrase/tongue twister, manual or automatic turning, word length and pace without correct/incorrect grading.

Each mechanic is added once and then given multiple independent item banks.

## First stage of filling

### Mathematics

- comparison of numbers;
- operations with ordinary and decimal fractions;
- percentages and proportions;
- procedure and examples with brackets;
- linear equations;
- coordinate plane and reading diagrams.

### Language Arts

- alphabet and division into syllables;
- unstressed vowels and checked consonants;
- cases and parts of speech;
- morphemic analysis;
- main and minor members of the sentence;
- punctuation and sentence assembly.

### English

- basic vocabulary for situations;
- word order and questions;
- `have/has`, `do/does`, forms `to be`;
- tenses and time markers;
- degrees of comparison;
- modal verbs and short everyday dialogues.

### Science and humanities subjects

- physical formulas with the choice of an unknown quantity;
- chemical symbols, valences and equations of simple reactions;
- biological systems and organ functions;
- geographical objects, maps and climatograms;
- historical chronology, causes and consequences;
- social studies terms and exam format assignments.

## Topic readiness criterion

A topic is considered added not by the presence of a card in the catalog, but when:

1. there are at least 20 independent variations or a verifiable parametric generator;
2. each answer has a short explanation or rule;
3. ambiguous questions and incorrect distractors are excluded;
4. the training takes place from the keyboard and on a 390 px screen without horizontal scrolling;
5. the timer can be adjusted to the speed of the skill;
6. errors are saved to a local replay and displayed correctly in the results.

## Work order regarding game templates

1. Bring Couples up to standard quality and use their contract as the standard for the rest of the games.
2. At the same time, expand light simulators only through ready-made universal mechanics.
3. After “Pairs”, complete entering the word and assembling the sequence - they will open the main volume of Russian and English.
4. Then add interactive diagrams for mathematics, physics, chemistry and geography.
5. Connect AI to simulators only after the task outline, subject validator and tutor preview appear.
