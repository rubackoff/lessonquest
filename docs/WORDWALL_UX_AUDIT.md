# UX/UI audit of Wordwall and MVP interface direction

Audit date: July 29, 2026.  
Area: authorized teacher account, template catalog, editor, AI generation, resource screen, basic and arcade games, tasks, results, community and mobile version.

The document does not contain a login, password or other account data.

## 1. Brief conclusion

Wordwall is strong not in its visuals, but in its clear product model:

1. the teacher sees the materials in a familiar grid;
2. selects a ready-made template;
3. introduces structured content;
4. can run the same content in a different game mode;
5. gives the student a link and, if necessary, collects the results.

This mental model is worth preserving. There is no need to copy the interface itself: it is overloaded, poorly adapted for the phone, mixes the author's tools and the student's screen, and the visual themes mainly change the scenery, but do not improve the mechanics.

Our solution: a familiar library with material cards, two inputs to creation - through AI or a template catalog, a single content model, separate game renderers and a completely isolated student player.

## 2. What was checked

- library "My activities";
- catalog of more than 30 templates;
- flash card editor;
- AI modal generation window;
- basic modes "Match", "Find a Pair" and "Flash Cards";
- arcade mode Maze Chase;
- switching one material between different templates;
- visual themes and game options;
- task creation and results section;
- catalog of public materials;
- page behavior on mobile viewport 390 × 844.

No materials or tasks were published on the account. When opening the editor, Wordwall created only its own autosaved, untitled draft.

## 3. What works well in Wordwall

### 3.1. Material library

On desktop, the library is a grid of four to five columns. The card immediately shows a preview of the game, the name of the material, the type of template, privacy, number of starts and an action menu. This is a successful model, already familiar to teachers: the material is learned visually faster than from a row in a table.

Useful items worth saving:

- search;
- sorting;
- folders;
- switching card size;
- quick access to launch and editing;
- a preview of the actual game screen, not an abstract icon.

### 3.2. Step by step creation

Wordwall uses a clear "Select Template → Enter Content → Play" sequence. The user always understands where he is, and the form of the editor depends on the selected type of game.

### 3.3. One content - several templates

The most important architectural decision of Wordwall: the teacher can switch the already introduced material to another compatible game template. Term-definition pairs do not belong to the same game; they can be displayed as matching, pairing, flashcards, or other mode.

This confirms the architecture we have chosen `content family → renderer → theme`: AI creates verifiable content, not code or a separate HTML game.

### 3.4. Editor that matches the content schema

In the flash card editor, each line contains front and back, image, sound, and basic formatting. For a tutor, such table input is faster than a universal block constructor.

### 3.5. Startup and task settings

Wordwall separately stores display parameters: timer, shuffle, repeat errors, evaluation method, auto-advance and final screen. In the assignment modal window, you can separately set the student’s name, deadline, and available actions after completion.

## 4. What does not need to be repeated

### 4.1. Fixed desktop interface

At 390 pixels wide, the library page is effectively still a desktop page, shrinking into a narrow area on the left and leaving a lot of white space. This is a critical drawback for tutors who often access materials from their phones.

### 4.2. Mixing classroom and student play

On the resource page the following simultaneously compete:

- playing field;
- playlist;
- template switching;
- themes and fonts;
- parameters;
- publishing, embedding and creating a task;
- social action;
- recovery banners and surveys.

The student script should open as a separate blank page without authoring tools and marketing noise.

### 4.3. Flat template catalog

More than 30 patterns are shown in one long grid. There is no good grouping by learning goal, subject, age or lesson format. The tutor is forced to know the names of the mechanics in advance.

### 4.4. Themes as a set of random skins

There are about 30 themes in the settings: from a wooden table and beach to dinosaurs, neon and the Wild West. There are many of them, but they do not form a coherent design system and hardly change the gaming experience.

We don’t need dozens of scattered skins, but several high-quality delivery modes:

- children's;
- teenage;
- neutral educational;
- adult/professional;
- high contrast.

### 4.5. AI without structured preview

AI opens as a separate modal window with one large text field and file upload. The user does not see which fields will be created until the generation is completed. In the Russian localization, a broken line of question marks was also visible.

In our editor, the AI ​​result should immediately fall into the same fields as manual input, go through the scheme and be shown in a live preview before publication.

### 4.6. Outdated visual and game presentation

Basic games are functional, but use heavy dark backgrounds, small elements, weak typographic hierarchy and clipart. Even the working Maze Chase is reminiscent of an early mobile game: the mechanics are different from the quiz, but the environment and feedback feel dated.

## 5. Proposed information architecture

### 5.1. Upper level Studio

For the first full-fledged office, three main sections are enough:

- **Library** - all teacher materials;
- **Create** — AI request or template selection;
- **Results** - student attempts and assignments, later.

While the user infrastructure is deferred, Studio acts as a local library of the current tutor. The architecture of routes and components should not require real game development accounts.

### 5.2. Teacher's library

The main screen retains the familiar Wordwall grid, but makes it faster and more informative.

Control panel:

- search bar by title and content;
- filters “Subject”, “Age/Grade”, “Skill Type”, “Template”;
- sort by modification, creation, name and last run;
- folders and tags;
- toggle "Grid/List";
- a prominent “Create Activity” button.

Material card:

- preview 16:10 from a real renderer;
- title in two lines with correct processing of long Russian text;
- subject and age group;
- name of the game mode;
- status “Draft / Published”;
- number of completions and average result when data becomes available;
- main actions “Run”, “Edit”, “Share”;
- secondary actions “Duplicate”, “Move”, “Delete” in the menu.

Additions regarding Wordwall:

- the “Recent” block at the beginning of the library;
- saved filters for different tutor subjects;
- quick viewing without going to the editor;
- duplicating material directly into another renderer;
- mass assignment of a folder or tags;
- clear empty state with two paths: AI and manual template.

### 5.3. Adaptive mesh

Minimum criteria:

| Width | Grid |
| --- | --- |
| 1440 px and more | 4 cards |
| 1024–1439 px | 3 cards |
| 680–1023 px | 2 cards |
| up to 679 px | 1 card |

At any width:

- no horizontal scrolling;
- interactive targets no smaller than 44 × 44 px;
- filters on the phone open in the bottom panel;
- basic actions are available without hover;
- the preview maintains proportions;
- skeleton, empty state and error do not change the width of the layout.

## 6. Two ways to create material

Wordwall starts by choosing a template. Our AI-first product requires an additional, faster path.

### Path A: “Describe the activity”

1. The tutor writes the goal in ordinary language: subject, topic, level and desired format.
2. AI creates canonical content and offers two or three compatible renderers.
3. The user selects an option, edits the generated fields and sees a live preview.
4. The material is published only through a separate manual action.

### Path B: "Select Template"

1. The tutor opens a familiar grid of templates.
2. Selects mechanics.
3. Fills out the diagram manually, by inserting from a table or through AI inside the editor.
4. Checks the preview and publishes it.

Both paths must lead to the same object `Activity`; these are two authoring interfaces, not two architectures.

## 7. New template catalog

Instead of one flat list, the catalog is grouped by learning activity:

| Learning Action | Basic modes | Gaming renderers |
| --- | --- | --- |
| Remember | Cards, answer entry | Memory run, spaced repetition |
| Find out | Quiz, true/false | Portal Rush, Arena of Choice |
| Correlate | Pairs, matches | Communication lines, dynamic matching |
| Classify | Groups, sorting | Conveyor, high-speed gate |
| Arrange | Sequence, timeline | Runner with the correct route |
| Apply | Problem, formula, case | Laboratory, simulation, base defense |
| Find the error | Correction of text/solution | Glitch Hunter, investigation |

The template card shows:

- a short video or animated preview of the mechanics;
- appropriate content types;
- subject examples;
- recommended age and pace;
- availability of timer, images, sound and formulas;
- “Suitable for adults” mark where the visual is neutral.

## 8. Separation of content, renderer and design

```text
Activity
  ├─ metadata: name, subject, level, language
  ├─ content: typed training data
  ├─ rendererId: interaction method
  ├─ experiencePreset: child/teen/adult/high-contrast
  └─ sessionSettings: timer, shuffle, repeats, feedback
```

General engine parameters:

- without timer / counting up / counting down;
- mixing;
- one attempt or repeated errors;
- instant or delayed feedback;
- showing an explanation;
- sound, vibration, reduced motion;
- difficulty level and speed.

Renderer only stores parameters unique to its mechanics. The design should not change the rules or break the dimensions of interactive elements.

## 9. Student player

Page `/play/:activityId` should be an independent game screen.

Before the start:

- title;
- one short instruction;
- large live preview;
- one main button “Start”;
- if necessary, the student's name.

During the game:

- game scene only;
- progress, lives or accuracy - if this is part of the mechanics;
- pause, sound and full screen mode;
- no author tools, themes, publications or similar materials;
- finger, mouse and keyboard controls;
- clear feedback not only by color.

After the game:

- the result in clear language;
- what worked and what to repeat;
- repeat mistakes;
- play again only if the teacher allows it.

## 10. Gaming conclusions from comparison

### Basic modes

Wordwall flash cards use a working model: show question, flip, then select true/false only. Our Memory Deck retains this simplicity, but enhances it with a physical stack, distinguishable sides, context, and meaningful sorting animations.

For pairs, quiz, sorting, skipping and sequencing, the same rule applies: the basic mechanics should be instantly understandable, but visually look like a complete digital product, not a school widget.

### Arcade modes

Maze Chase showed a useful principle: the question is asked by the target, and the answer is chosen by a physical action within a separate game loop - moving through the maze, avoiding opponents and entering the correct zone. This is truly a new mechanic, and not a decorative quiz skin.

Modern arcade-wrappers for our content families:

- **Portal Rush** - choose the correct portal in a short runner round;
- **Glitch Hunter** - find and fix a bug in an interactive scene;
- **Signal Defense** - protect the sector with the correct answers;
- **Rhythm Recall** - respond to the beat without a penalty for quiet mode;
- **Lab Escape** - apply a formula or rule to open the next area;
- **Sort Factory** - Send objects into categories on a moving conveyor belt.

Arcade does have its own loop, but it receives the same typed data as the base renderer.

## 11. Comparison of solutions

| Observation in Wordwall | Solution for our MVP |
| --- | --- |
| Familiar Material Mesh | We save the grid, strengthen it with filters, quick actions and normal adaptability |
| First, mandatory template selection | Adding a peer AI-first path |
| One content switches between templates | Secured as a key architectural contract |
| Long flat pattern list | Grouping by learning goal, subject, age and pace |
| About 30 unrelated skins | 4–5 solid experience presets |
| Author settings surround the game | We take the student to a separate distraction-free player |
| AI returns result from opaque modal window | We validate it into the diagram and immediately show it in an editable live preview |
| Basic games are clear, but visually outdated | Keeping the rules simple, updating composition, typography, motion and feedback |
| Maze Chase has a separate game loop | We build arcades as renderers on top of compatible content families |
| Mobile library is actually broken | Designing mobile-first states and checking viewport 390 × 844 for each vertical |

## 12. Interface implementation sequence

### Stage 1. Studio frame

1. Top navigation "Library/Create/Results".
2. Adaptive library grid based on existing activity data.
3. New card with real preview and quick actions.
4. Search, sort and minimal filters without user infrastructure.

Check: Six existing templates are displayed in the shared library; desktop, tablet and mobile do not have horizontal scrolling.

### Stage 2. Catalog and creation

1. Separate basic and arcade renderers.
2. Add categories by learning activity.
3. Save manual template selection.
4. Add an AI-first form that recommends compatible templates.

Check: one request can be opened in two proposed renderers without re-generating the content.

### Stage 3. Single editor screen

1. Schematic form for the selected content family.
2. Live preview on the right on a wide screen and a separate tab on the phone.
3. Session and experience preset settings.
4. Explicit states “Draft”, “Checked”, “Published”.

Verification: manual input and AI modify the same draft; publication is always separate.

### Stage 4. Clean player

1. General starting scene.
2. Unified pause, sound, fullscreen and end.
3. Complete removal of Studio navigation from the student page.
4. Keyboard, touch, reduced motion and high contrast.

Verification: the student plays any of the six existing games only via a public link; Studio elements are inaccessible and visually missing.

### Stage 5. Modern arcade

The first arcade game is recommended `Portal Rush`: It uses existing quiz content, is noticeably different from card mechanics, and allows you to test movement, collision, touch control, pacing, and performance without creating a second data format.

## 13. UI vertical readiness criteria

- the library is understandable without training as a Wordwall user;
- creation is available both through AI and through a grid of templates;
- one content is reused by at least two renderers;
- the student screen does not contain teacher functions;
- the interface works at 390 × 844 without horizontal scrolling;
- all main actions are accessible from the keyboard and have a visible focus;
- `prefers-reduced-motion` disables optional movement;
- adult mode does not use children's clipart and intrusive gamification;
- visual effects do not delay response or obscure instructional feedback;
- long Russian names and multi-line tasks do not break the grid.

## 14. Verified Wordwall references

Authorized sections:

- `https://wordwall.net/ru/myactivities` - library;
- `https://wordwall.net/ru/create` — catalog and beginning of creation;
- `https://wordwall.net/ru/myresults` - results.

Public game examples:

- [Maze Chase: RUN! GAME](https://wordwall.net/ru/resource/12487607/maze-chase/run-game);
- [Flash cards](https://wordwall.net/ru/resource/80278182/cvo-11-thema-1-voorwerpen-in-de-klas).

Links are recorded as product references. Copying other people's illustrations, code, assignment texts and corporate design is not required.
