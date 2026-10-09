# Subject Coverage Matrix

Date: July 31, 2026.

## Unified taxonomy of items

The editor is not limited to the items of current ready-made banks. The subject field uses a single reference book and at the same time allows free entry for narrow specializations.

The reference book includes preparation for school, speech therapy, primary school, the outside world, mathematics, algebra, geometry, Russian, literature, physics, chemistry, biology, ecology, astronomy, geography, history, social studies, computer science, fine art, music, English, German, French, Spanish, Chinese and other foreign languages, economics, law, programming, preparation for the Unified State Examination and professional skills.

The taxonomy is stored centrally in `lib/subject-taxonomy.ts`. The new item does not require a separate version of the game: content banks and item validators are different, and the renderer remains common.

## Current Status

The library contains 2766 editable sets for six game templates:

- 54 editorial material;
- 28 subject banks;
- 224 tested learning units;
- 24 deterministic combinations for each bank;
- 672 generated set of "Pairs";
- 912 generated quizzes, including 240 parametric computational options;
- 672 generated memory decks;
- 336 generated sortings from 14 subject category banks;
- 120 generated rounds “Find the error” from 5 checked blueprints;
- 2712 generated materials in total.

Including editorial content, the catalog includes 707 Par sets, 916 quizzes, 676 memory decks, 340 sorts, 124 Find the Bug rounds and 3 physical arcade levels.

All new materials were created from scratch by the editors from well-known facts, standard notations and educational rules. Wordwall content was not migrated.

## Coating "Steam"

| Direction | Ready set | Audience |
| --- | --- | --- |
| Preschool Development | Figures and their characteristics | 5–7 years |
| Primary school | Units and ratios | Grades 2–4 |
| Russian language | Parts of speech and questions | Grades 4–6 |
| Literature | Means of expression | Grades 5–8 |
| English | Travel English: basic words | A2–B1, adults |
| German | Articles of German nouns | A1 |
| French | Polite phrases | A1 |
| Spanish | Polite phrases | A1 |
| Chinese | Phrases, pinyin and translation | Entry level |
| Arithmetic | Common and decimal fractions | 5th–6th grade |
| Algebra | Abbreviated multiplication formulas | 7th grade |
| Geometry | 8 sets of standard SVG diagrams | Grades 5–10 |
| Probability and Statistics | Basic properties of probability | Grades 7–9 |
| Mathematical analysis | Basic derivatives | 10–11 grade, university |
| Computer Science | Data, algorithm and variable | Grades 5–8 |
| Physics | SI quantities and units | Grades 7–9 |
| Chemistry | Elements and symbols | 7th–8th grade |
| Biology | Cell organelles and functions | Grades 6–8 |
| Ecology | Roles in the food chain | Grades 6–8 |
| Astronomy | Planets and signs | Grades 5–9 |
| Geography | Lines on the map | Grades 5–7 |
| History | Key historical dates | Grades 6–10 |
| Social Studies | Public institutions | Grades 6–9 |
| Economics | Basic economic concepts | Grades 8–11, adults |
| Right | Branches of law and relations | Grades 8–11 |
| Fine arts | Types and techniques of art | Grades 5–9, adults |
| Music | Tempo and dynamics | Grades 5–9, adults |
| Vocational training | Work communication terms | Adults |

## How to expand the library

The first layer answers the question “can a tutor of any major direction find at least one ready-made material.” The following layers are responsible for depth.

### Layer 2. Themes

For each subject, 8–12 basic topics are created. For example, for physics: mechanics, pressure, work and energy, electricity, optics and thermal phenomena.

### Layer 3. Mechanics

Each topic receives a minimum of four submissions:

- “Pairs” for terms, images and correspondences;
- "Grouping" for classification;
- Quiz to check understanding;
- "Memory deck" for active playback.

Find the bug, sequences, formations, and arcade modes are only added where the mechanics truly reinforce the learning challenge.

### Layer 4. Options

Computational and grammar tasks move to blueprint with reproducible `seed`. One proven blueprint creates dozens of options without manually copying cards.

## Next goal

- expand each subject from one bank to 8–12 topic banks;
- expand the bank of categories and parametric blueprints after the subject review;
- add generators of language transformations and sequences;
- transfer the search to the server database after 10,000 materials;
- add editorial statuses and subject reviews;
- add illustrations and declarative diagrams to ready-made sets.

The current 2766 materials provide a wide MVP catalog without copying an external database. The next quality is achieved not by the height of the counter, but by thematic depth, subject review and visual tasks.
