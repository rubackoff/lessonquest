# Library of ready-made content, AI and visual worlds

## 1. What already works in MVP

The document records the implemented vertical and the target architecture for the next stage.

| Opportunity | State | Where implemented |
| --- | --- | --- |
| Generating a task in plain language | Powered by OpenAI-compatible `chat/completions`, strict JSON Schema and server-side validation | `app/api/ai/generate/route.ts`, `lib/ai-generation.ts` |
| Real request to the configured model | Verified: `gpt-5-6-sol` returned a valid draft of "Par" in geometry | server AI circuit |
| Library of ready-made solutions | 2766 valid sets for six game patterns: 54 editorial and 2712 deterministic | `lib/content-library.ts`, `lib/generated-content-library.ts` |
| Multi-subject game adaptations | 672 Par Sets, 912 Quizzes, 672 Memory Decks, 336 Sorts and 120 Find the Bug Rounds | `lib/content-fact-banks.ts`, `lib/generated-group-content.ts`, `lib/generated-parametric-content.ts` |
| Search by topic, subject, grade and tags | Works inside the selected template | `searchContentLibrary()` |
| Geometric catalog for "Pairs" | 8 Sets, 32 SVG Diagrams: Shapes, Angles, Circles, Graphs and Solids | `lib/geometry-diagrams.ts`, `components/geometry-diagram.tsx` |
| Using a set in the constructor | Fills in all fields, maintains editability and validity | `components/activity-editor.tsx` |
| Images in educational content | In “Couples” - for both sides; in “Groups” - for each card; in the quiz - for the question and each answer | `lib/learning-media.ts`, `components/learning-image.tsx`, game renderer components |
| Visual Worlds | 5 themes: classics, underwater world, space, paper, arcade; full integration completed for all six base templates | `lib/visual-themes.ts`, `lib/canvas-worlds.ts`, game renderer components, `app/lab.css` |
| Save the selected theme | `visualThemeId` included in Level JSON, publish and test run | editor, studio player, student player |
| New font | Local variable-font Onest with Cyrillic, without external request to Google Fonts | `app/layout.tsx`, `@fontsource-variable/onest` |
| Checking in the browser | All renderer families have been tested; the arcade “Laboratory of Forces”, the paper “Find the Error” with the correct choice and the underwater “Memory Deck” with a swipe are recorded separately | QA screenshots in `output/playwright/` |

Important: AI now creates text fields strictly for the selected mechanics. SVG diagrams in version 1 are editorially proven specifications. The next safe step is to only allow the AI to choose from a white list `GeometryDiagramSpec`, but does not generate arbitrary SVG code.

## 2. Custom model

The structure remains familiar to the Wordwall user, but removes his main dead end: the tutor does not need to first come up with all the material and then manually type it into the fields.

```text
Choice of mechanics
  → search for ready-made solutions
  → application of a verified set or AI draft
  → editing fields
  → selection of the game world
  → live preview
  → publication and link to the student
```

The template grid remains recognizable: name, short description and mechanics preview. Additions for our platform:

- the search is located right in the creation of the task and already knows the selected mechanics;
- one finished set opens as a regular editable draft;
- diagrams and images are part of the content contract, and not a decorative background;
- The theme changes the atmosphere of the game regardless of the educational content;
- AI cannot break the renderer with arbitrary text or HTML.

## 3. Current MVP architecture

### 3.1 Library entry

```ts
type ContentLibraryItem = {
  id: string;
  gameId: GameId;
  title: string;
  subject: string;
  grade: string;
  summary: string;
  tags: string[];
  preview?: GeometryDiagramSpec;
  draft: EditorDraft;
  source: 'LessonQuest Editorial Board' | 'LessonQuest Generator';
};
```

`draft` stores not a free document, but one of the six existing editor contracts. Therefore, the search result immediately goes through the same `buildEditableLevel()` and `validateEditorDraft()`, that manual and AI draft.

For MVP, the directory is a typed TypeScript module. This is a simple and reliable solution until the appearance of a methodologist’s office. It gives:

- review of changes with the usual diff;
- lack of a separate database for the first tens of sets;
- compile-time data form checking;
- fast local search without network request.

Limitation: such a catalog is updated only through deployment and does not support methodical workflow. Up to 10,000 sets it remains fast thanks to filtering and pagination, but the next production stage is to move the records to server storage.

### 3.2 Search

Now searching:

1. filters materials by `gameId`;
2. converts the query and indexed fields to lower case;
3. normalizes `e` in `e`;
4. searches all query words in title, subject, class, description and tags.

Target version in PostgreSQL:

```sql
content_template(
  id uuid primary key,
  game_id text not null,
  locale text not null,
  title text not null,
  subject_id uuid,
  grade_from smallint,
  grade_to smallint,
  audience text,
  summary text,
  tags text[],
  draft jsonb not null,
  schema_version integer not null,
  status text not null,
  source_id uuid,
  search_vector tsvector,
  published_at timestamptz
)
```

First server search: PostgreSQL Full Text Search + `pg_trgm` for typos. A separate Elasticsearch is not needed. Ranking:

```text
exact topic match
  > name
  > subject + class
  > tags
  > description
  > popularity among tutors
```

Filters required: subject, age/grade, CEFR level, content type, language, duration, presence of diagrams, “tested by a methodologist.”

### 3.3 Geometric schemes

The schema is stored as a secure declaration:

```ts
type GeometryDiagramSpec = {
  kind: 'triangle' | 'quadrilateral' | 'circle' | 'angle' | 'plot' | 'solid';
  variant: string;
  label: string;
};
```

The Renderer draws whitelisted functional SVG. SVG markup is not included in JSON. Pros:

- arbitrary code is not executed;
- the diagram is scaled without blurring;
- color is inherited from the theme;
- the available name is stored next to the data;
- one spec works in the directory, editor and game;
- the specification can be validated deterministically.

For more complex geometry, a second level is introduced:

```ts
type GeometryScene = {
  viewport: { xMin: number; xMax: number; yMin: number; yMax: number };
  points: Array<{ id: string; x: number; y: number; label?: string }>;
  primitives: Array<Segment | Ray | Circle | Polygon | FunctionPlot>;
  constraints?: Array<Parallel | Perpendicular | EqualLength | FixedAngle>;
};
```

It is advisable to do interactive constructions on JSXGraph, and leave simple previews and cards on our SVG-renderer. JSXGraph supports geometry, graphics, SVG/Canvas and touch; It's a suitable engine, but not a reason to port simple iconographic schemes to it.

### 3.4 Visual themes

The theme does not change the rules and does not copy the game component. It defines a set of semantic tokens:

```ts
type VisualThemeId =
  | 'corgi-classic'
  | 'deep-sea'
  | 'space-station'
  | 'paper-workshop'
  | 'arcade-city';
```

Basic CSS tokens:

| Token | Destination |
| --- | --- |
| `--game-stage-background` | background, image or game scene layers |
| `--game-heading` | header on stage |
| `--game-copy` | instructions on stage |
| `--game-card-ink` | interactive card text |
| `--game-card-background` | card surface |
| `--game-card-border` | card border |
| `--game-card-shadow` | depth of interactive objects |
| `--game-accent`, `--game-accent-2` | connections, progress, focus, successful actions |
| `--game-progress-track` | progress bar background |
| `--game-coach-background` | corgi coach replica |

DOM games get their theme through these CSS tokens. Canvas games use a common typed layer `lib/canvas-worlds.ts`: It specifies the material palette, panels, contrast, scene background, and acceptable background motion. Therefore, the theme changes not only the picture from behind, but also the internal light, surfaces, instruments and feedback of the mechanics themselves.

Topic rules:

- the contrast of text and interactive elements is checked separately for each world;
- the background should not contain important details in the central working area;
- Thematic animation only works on decorative layers;
- `prefers-reduced-motion` disables endless movements;
- the theme is stored with the activity, and not in the user profile;
- for adults there is a calm theme without characters and bright arcade plastic;
- the same world should work equally recognizable in all mechanics.

DOM renderers receive semantic tokens through CSS variables. Canvas-renderer "Groups" uses a typed palette with the same semantic roles, since already drawn Canvas pixels do not inherit CSS. This saves one theme contract without trying to duplicate all game mechanics.

## 4. AI circuit

### 4.1 What's happening now

```mermaid
flowchart LR
  Prompt["Tutor description"] --> Route["POST /api/ai/generate"]
  Route --> Schema["JSON Schema of the selected game"]
  Schema --> Model["OpenAI-compatible chat/completions"]
  Model --> Parse["parseGeneratedDraft"]
  Parse --> Validate["validateEditorDraft"]
  Validate --> Editor["Editable draft"]
```

The model receives only the fields of the selected template. Used `response_format: json_schema` with a strict schema, then a local parser and domain validation. If the first response is invalid, the server makes one repair request. The tutor always sees the preview and publishes the material himself.

### 4.2 Next extension

There is no need to ask the model to “draw the geometry.” We need to give her the tools:

```json
{
  "tool": "search_library",
  "arguments": {
    "subject": "geometry",
    "topic": "triangle area",
    "grade": 7,
    "gameId": "match-pairs"
  }
}
```

AI-orchestrator must:

1. first find suitable verified library elements;
2. reuse images and diagrams from a known source;
3. generate only missing text;
4. choose `GeometryDiagramSpec` from the allowed options;
5. check formulas with a separate deterministic validator;
6. return provenance for each borrowed element;
7. do not publish the result automatically.

For mathematics, SymPy/MathJS checks for expression equivalence and test substitutions are added. For languages ​​- normalization of case, punctuation and acceptable answer options. For actual items - the subject review queue.

## 5. Library filling conveyor

### 5.1 Material statuses

```text
draft → machine_validated → subject_review → copy_review → visual_review → published → deprecated
```

### 5.2 Mandatory checks

| Check | Automatically | Man |
| --- | --- | --- |
| JSON Schema matching | yes | no |
| Renderer limitations | yes | no |
| Formulas and numerical answers | yes, where possible | selectively |
| Factual Correctness | partially | yes |
| Age and difficulty | heuristics | yes |
| Clarity of wording | heuristics | yes |
| License and Source | presence of fields | yes |
| Contrast and crop preview | screenshot QA | yes |
| Mobile walkthrough | Playwright | selectively |

### 5.3 Volume plan

| Stage | Volume | Composition |
| --- | ---: | --- |
| Current MVP | 2766 | all 6 mechanics; factual combinations, sorting, parametric calculations and searching for common errors |
| Content MVP | 60 | minimum 8-12 strong sets on core mechanics |
| Closed beta | 250 | mathematics 5–9, Russian 5–9, English A1–B2, physics 7–9, biology 5–8 |
| Public launch | 1,000 | topical coverage on curriculum and adult scenarios |

Recommended first production package:

- geometry: 60 sets, 25 of them with interactive diagrams;
- algebra: 50;
- English for school: 50;
- English for adults: 35;
- Russian language: 35;
- physics: 25;
- biology and chemistry: 20 each;
- history and social studies: 15–20;
- universal meta-skills and warm-ups: 20.

Each theme must appear in at least three mechanics. Otherwise, the catalog will seem large, but in fact monotonous.

## 6. Sources and licenses

The finished Wordwall database cannot be copied or stapled. We repeat the convenient search and application model, but create our own materials and record the origin of each element.

| Source | How to use | Limit |
| --- | --- | --- |
| H5P | Reference of open modular architecture content types and list of mature mechanics | Check the license of each content type and do not copy user content |
| JSXGraph | Possible interactive geometry and graph engine | Comply with the LGPL/MIT terms of the selected delivery |
| Mathigon Textbooks | Reference of the interactive lesson structure, functions and general assets | Repository contents are marked All Rights Reserved, do not import without permission |
| OpenStax | Possible source of selected OER materials after checking a specific publication | In 2026, the new materials license includes NC; for a commercial product, mass import cannot be considered permitted |
| OATutor | Reference JSON representation of tasks and training steps | Check the license of the original textbook and each set |
| Own editorial | Primary Starter Library Source | Need subject review and changelog |
| Tutor materials | Custom private content and voluntary publication in the community directory | The author confirms the rights, moderation and takedown process are needed |

The production record must have:

```ts
type ContentProvenance = {
  sourceType: 'original' | 'user' | 'oer' | 'licensed' | 'ai-assisted';
  sourceUrl?: string;
  author?: string;
  licenseSpdx?: string;
  licenseVersion?: string;
  attributionText?: string;
  commercialUseAllowed: boolean;
  modified: boolean;
  reviewedBy: string;
  reviewedAt: string;
};
```

## 7. What is taken from design references

### Emil Kowalski skills

The discipline of motion and interactions comes from skills; ready-made game primitives are now also selected from a separate audit of source-first libraries:

- a good interface starts with a strong default-state;
- small details accumulate a sense of quality;
- pressing uses small `scale(0.98)`, not theatrical animation;
- hover only applies to devices with `hover: hover` and `pointer: fine`;
- transitions list specific properties;
- endless decorative animation is disabled via reduced motion;
- the visual hierarchy is built by weight, size and space, and not by a dozen frames.

### Motion

Suitable for spring card movements, layout transitions and gestures. Simple states remain on CSS transitions, and more complex game interactions are connected point-by-point through our `interaction layer`. A map of sources, licenses, effects and restrictions is recorded in [audit of interactive libraries](./INTERACTION_LIBRARIES.md).

### Astryx

Useful as a reference for topics on CSS variables and available primitives. Migrating the current project to StyleX for the sake of a library in beta status is not justified.

### H5P

Key architectural takeaway: The content type, editor, and player should be versionable modules in their own right. H5P also gives a good list of basic mechanics that teachers will already understand.

## 8. Appearance audit

| Before | After | Why |
| --- | --- | --- |
| Inter/system stack | Onest Variable with Cyrillic | More characteristic, but neutral humanistic grotesque for children and adults |
| Weights 760-950 almost everywhere | Body text 430–580, emphasis 600–700 | Removes the feeling of “everything is screaming” and gives a real hierarchy |
| Repeating radius 8 px | Panels 16–18, controls 11–12, internal labels 7–8 | Objects vary in level rather than appearing as one AI component mesh |
| Blue-green AI-gradient | Calm Solid Mint Panel | AI remains a tool, not the main advertising banner |
| Text pairs only | SVG diagram + short caption | Geometry and graphs become real learning content |
| One bright scene | 5 tokenized worlds | Variability without duplication of mechanics |
| Random hover effects | hover only for fine pointer, press `scale(0.98)` | Correct mouse and touch behavior |
| There is no single motion policy | transitions for states, reduced motion for ambience | The interface feels alive without being boring |

## 9. The following sequence of work

1. Make two new arcade mechanics based on the same canonical content: a runner with a choice of lane and precision timing.
2. Carry out an in-game polish-pass: mobile sizes, sound, optional vibration feedback and visual regression of the five worlds.
3. Translate `ContentLibraryItem` to the server API with PostgreSQL FTS, keeping the current TypeScript seed.
4. Add a methodologist's office: draft, checks, preview of all topics, publication.
5. Add 33 sets up to Content MVP = 60 and cover each mechanic with at least eight strong examples.
6. Connect JSXGraph for tasks with coordinates, constructions and controlled points.
7. Allow AI to call `search_library` and select schemes from the white list.
8. Add provenance, license gate and a ban on publishing material without a source.
9. Add Playwright visual regression for desktop/mobile and every theme.

## 10. Technical references

- Emil Kowalski skills: <https://github.com/emilkowalski/skills>
- Motion: <https://github.com/motiondivision/motion>
- OriginKit: <https://www.originkit.dev/>
- React Bits: <https://reactbits.dev/>
- Canvas UI: <https://canvasui.dev/>
- HyperUIX Vault: <https://vault.hyperiux.com/effects>
- Astryx: <https://github.com/facebook/astryx>
- H5P repositories: <https://github.com/orgs/h5p/repositories>
- JSXGraph: <https://github.com/jsxgraph/jsxgraph>
- Mathigon Textbooks: <https://github.com/mathigon/textbooks>
- OpenStax licensing: <https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks>
- Onest: <https://github.com/simpals/onest>
