# PixelRAG and library of ready-made tasks

Decision date: July 30, 2026.

Local structure for own, licensed and reference-only materials created in [`content-archive/README.md`](../content-archive/README.md). It covers all subjects, not just geometry.

## 1. Short conclusion

PixelRAG is suitable for the project as an internal visual search tool for permitted sources: PDF, web pages, screenshots, tables, graphs and geometric drawings. It should not be the primary job repository and does not replace the domain data model.

Correct chain:

```text
authorized source
  -> PixelRAG: pages and visually similar fragments
  -> VLM: Extract to strict JSON
  -> normalization in CanonicalExercise
  -> mathematical and licensing verification
  -> it's the methodologist's turn
  -> generation of variants by seed
  -> game template adapters
  -> tutor library
```

PixelRAG answers the question “which pages have relevant tasks and pictures.” Our platform answers the questions “what is this problem”, “is it the right answer”, “is it possible to publish it” and “how to turn it into a specific game”.

## 2. Why can't you just copy the Wordwall library?

Wordwall is useful as a product reference: topics, search queries, popular formats, ways to use one content in several templates. However, mass automatic copying of published assignments into our commercial library creates technical and legal risks.

Under the current terms and conditions of Wordwall, it is prohibited to distribute parts of the service without permission and to receive content using technologies not designated by the service itself. User content is permitted to be used only within the limits of the functionality of the service and its terms. Therefore, we do not use an authorized account for mass crawling, do not save closed materials, and do not transfer other people’s texts or images without confirmed rights.

Safe operating modes:

1. Manual study of Wordwall as a reference for mechanics, navigation and topic coverage.
2. Import of materials created by the tutor himself or transferred by the author with the right to use.
3. Indexing of open sources with a CC0, CC BY, CC BY-SA, public domain license or separate written permission.
4. Create your own problems using the same training skills, but with new formulations, parameters, solutions and drawings.
5. Use of PixelRAG only for authorized editorial corps.

If you need the Wordwall collection, you need an official contract, API or written permission from the copyright holder and authors of the materials.

## 3. What does PixelRAG provide?

Repository `StarTrail-org/PixelRAG` published under Apache-2.0. Its useful parts:

- `pixelshot`: renders web pages, PDF and images in screenshot tiles;
- `pixelrag chunk/embed/build-index`: creates visual embeddings and FAISS index;
- `pixelrag serve`: raises HTTP search API;
- Qdrant backend: allows you to store vectors on disk, add payload and filter the results;
- `Qwen3-VL-Embedding-2B`: searches not only text, but also the visual structure of the page;
- Visual Query: Allows you to search for similar graphics and geometric drawings based on an image.

This is especially useful when HTML/OCR loses structure:

- signatures of points on the drawing;
- position of height and median;
- correspondence tables;
- function graphs;
- tasks contained within the scanned PDF;
- pages where meaning is determined by the arrangement of objects.

PixelRAG by itself does not provide:

- ready-made editable JSON task;
- checking mathematical correctness;
- licensing check;
- deduplication of identical tasks;
- generation of game options;
- methodological compliance with the class and program.

## 4. Placement in our architecture

PixelRAG runs as a separate editorial worker, and not inside the Next.js application.

```text
Next.js Studio
  -> Content API
      -> PostgreSQL: tasks, options, rights, statuses
      -> Object Storage: permitted sources and our media
      -> Search: PostgreSQL FTS + pg_trgm

Editorial Worker, Linux
  -> Source Registry
  -> pixelshot
  -> PixelRAG + Qdrant
  -> VLM extractor
  -> Math validator
  -> Review Queue
```

Reasons for separation:

- building a visual index is heavy and should not slow down the application;
- the embeddings model with 2B parameters works better on a separate GPU machine;
- current working Windows machine is suitable for `pixelshot`, but production-indexer is more reliable to run on a Linux worker;
- custom search for ready-made tasks is faster and cheaper to do using already normalized metadata;
- The original screenshots can be stored in the inner loop and not given to students.

For a local prototype, FAISS is sufficient. For a general editorial database you need Qdrant with payload filters `sourceId`, `license`, `subject`, `locale`, `grade` and `ingestionStatus`.

## 5. Register of sources and rights

Each source is registered before indexing.

```ts
type SourceRecord = {
  id: string;
  title: string;
  sourceUrl?: string;
  owner: string;
  license:
    | 'CC0-1.0'
    | 'CC-BY-4.0'
    | 'CC-BY-SA-4.0'
    | 'PUBLIC-DOMAIN'
    | 'OWN-CONTENT'
    | 'AUTHOR-PERMISSION';
  licenseUrl?: string;
  allowedUses: Array<'index' | 'adapt' | 'publish-text' | 'publish-media'>;
  attribution?: string;
  locale: string;
  checksum: string;
  reviewedBy: string;
  reviewedAt: string;
};
```

Publication rule: the absence of a confirmed license means publication is prohibited. Such material can only be left as internal reference if its use in itself is permitted.

For each published task, the following are saved:

- original source;
- license and required attribution;
- degree of processing;
- author of the new formulation;
- author or generator of the drawing;
- result of mathematical test;
- methodologist and date of inspection;
- version history.

## 6. Canonical task model

The finished material should not immediately belong to the game. First it becomes a subject entity, then it adapts to one or more templates.

```ts
type CanonicalExercise = {
  id: string;
  schemaVersion: 1;
  locale: 'ru' | 'en';
  subject: 'geometry' | 'algebra' | 'physics' | 'english' | string;
  topic: string;
  skills: string[];
  gradeFrom?: number;
  gradeTo?: number;
  audience: 'school' | 'exam' | 'adult';
  difficulty: 1 | 2 | 3 | 4 | 5;

  kind:
    | 'concept'
    | 'classification'
    | 'calculation'
    | 'proof-step'
    | 'construction'
    | 'error-analysis';

  prompt: RichLearningContent;
  answer: ExerciseAnswer;
  explanation: RichLearningContent;
  hints: RichLearningContent[];
  diagram?: GeometryScene;

  parameters?: ParameterSchema;
  constraints?: string[];
  estimatedSeconds: number;
  compatibleGames: GameId[];

  provenance: {
    sourceId: string;
    sourceLocator?: string;
    license: string;
    attribution?: string;
    transformation: 'original' | 'adapted' | 'generated';
  };

  review: {
    math: 'pending' | 'passed' | 'failed';
    method: 'pending' | 'passed' | 'failed';
    rights: 'pending' | 'passed' | 'failed';
  };
};
```

`RichLearningContent` supports text, formula, image and our secure declarative geometry scene. It does not store arbitrary HTML or executable SVG.

## 7. Geometric model

Current `GeometryDiagramSpec` suitable for iconographic cards: triangle type, circle element, area formula. For real tasks you need `GeometryScene`.

```ts
type GeometryScene = {
  viewport: { xMin: number; xMax: number; yMin: number; yMax: number };
  points: Array<{
    id: string;
    x: number;
    y: number;
    label?: string;
    draggable?: boolean;
  }>;
  primitives: Array<
    | SegmentSpec
    | RaySpec
    | PolygonSpec
    | CircleSpec
    | ArcSpec
    | AngleMarkSpec
    | LengthMarkSpec
    | FunctionPlotSpec
  >;
  constraints: Array<
    | ParallelConstraint
    | PerpendicularConstraint
    | EqualLengthConstraint
    | FixedAngleConstraint
    | PointOnObjectConstraint
  >;
  labels: Array<MathLabelSpec>;
};
```

Simple scenes are rendered with our SVG renderer. Interactive plotting and point dragging can be enabled via JSXGraph. The raster screenshot from the source does not become the main game image: VLM restores the declarative scene, after which the validator checks it and renders a new original drawing in the same product style.

## 8. Extracting from a found fragment

After a visual search, VLM receives a screenshot tile and source metadata. The model should return strictly defined JSON, not free text.

Minimum extraction result:

```json
{
  "sourceLocator": "book.pdf#page=42&tile=2",
  "candidateType": "calculation",
  "language": "ru",
  "topic": "sum of triangle angles",
  "prompt": "...",
  "knownValues": [],
  "unknownValues": [],
  "answerCandidate": "...",
  "solutionSteps": [],
  "diagramDescription": {},
  "confidence": 0.86,
  "needsHumanReview": true
}
```

An extract is always marked as a draft. Publishing directly from a model's response is prohibited.

## 9. Validation check

Geometry requires a three-level check.

### 9.1 Structural

- JSON Schema;
- required fields;
- acceptable units of measurement;
- absence of HTML, scripts and external unverified URLs;
- the existence of all points and objects referenced by constraints.

### 9.2 Mathematical

- SymPy for algebraic expressions and numerical answers;
- own checks of lengths, angles, areas and intersections;
- re-solving the generated problem from the parameters;
- property-based tests for hundreds of seeds;
- checking the uniqueness of the answer where it is required;
- tolerance for problems with approximate values.

### 9.3 Methodical

- Is the wording appropriate for age?
- is there enough data;
- does the drawing give the answer;
- is there any ambiguity;
- does the complexity correspond to the declared class;
- Is the explanation after the error helpful?

## 10. Parametric families instead of thousands of copies

The library should store not only individual jobs, but also proven generators.

```ts
type ExerciseBlueprint = {
  id: string;
  topic: string;
  generatorVersion: number;
  parameterSchema: ParameterSchema;
  generate(seed: string): CanonicalExercise;
  verify(exercise: CanonicalExercise): VerificationResult;
};
```

An example of the “third angle of a triangle” family:

1. the generator selects two integer angles;
2. checks that their sum is less than 180°;
3. excludes too obvious and inconvenient meanings;
4. builds a consistent scene;
5. calculates the third angle;
6. creates plausible incorrect options;
7. saves seed for reproducibility.

Thus, 40 high-quality blueprints can provide 800–2000 unique, proven options without manually copying cards of the same type.

## 11. Convert to Game Templates

One canonical task can have multiple views.

| Canonical material | Matching Games | Conversion |
| --- | --- | --- |
| Term + property + drawing | Pairs, Memory Deck | drawing ↔ term; term ↔ property |
| Classification of figures | Grouping, Pairs | figure → class |
| Computational problem | Quiz, arcade runner | condition + options + explanation |
| Sequence proof | Sorting steps | steps in correct order |
| Wrong decision | Find the error | mark the wrong transition |
| Geometric construction | Interactive whiteboard | points, constraints and purpose |

The adapter does not change the mathematical meaning. It only selects the fields that are valid for the selected game's renderer.

```ts
type GameAdaptation = {
  exerciseId: string;
  gameId: GameId;
  draft: EditorDraft;
  adaptationVersion: number;
  warnings: string[];
};
```

In Studio, the tutor sees not just a “ready-made task”, but available methods of application:

```text
Sum of triangle angles
7 class · 12 proven options · drawing included

[Play as a quiz]
[Collect pairs]
[Find error]
[Open and change]
```

## 12. Search for a tutor

The custom query “geometry triangles grade 7” works in PostgreSQL:

1. subject and class;
2. exact topic match;
3. study skills;
4. compatibility with the selected game;
5. availability of a verified drawing;
6. methodological review status;
7. popularity and success among students.

PixelRAG is used by editors to search the source corpus, for example:

- “drawing with height to the hypotenuse”;
- “equal chord problem”;
- image of a similar graph;
- screenshot of unknown task type.

## 13. Minimal production process

### Stage A. Foundation

- add `SourceRecord`, `CanonicalExercise` and `ExerciseBlueprint`;
- store each record with provenance and three review statuses;
- expand `GeometryScene`;
- make adapters for “Pairs” and “Quizzes”.

Result: 20 manually verified geometric blueprints.

### Stage B. PixelRAG POC

- deploy a separate Python environment;
- index only your own test PDF and open CC corpus;
- FAISS for local testing;
- perform text and visual search;
- extract 20 candidates into strict JSON;
- measure precision@5 and editor time per published material.

Success criterion: at least 80% of search results in the top-5 are really useful to the editor, and preparing the task takes no more than five minutes.

### Stage C. Editorial queue

- source and source fragment screen;
- normalized task editor nearby;
- automatic math checks;
- buttons “reject”, “correct”, “approve”;
- Mandatory rights check before publication.

### Stage D. Scaling

- Qdrant instead of local FAISS;
- object storage;
- background queues;
- deduplication by text and visual embedding;
- versioning of generators;
- error and complexity analytics.

## 14. First target collection

It is more profitable for an MVP not to try to repeat millions of materials at once. First quality vertical:

- subject: geometry;
- grades: 7–9;
- language: Russian;
- 10 topics;
- 4–6 blueprints per topic;
- 20 reproducible options on blueprint;
- 800–1200 options;
- at least two game adaptations of each blueprint;
- Each family undergoes mathematical and methodological review.

Topics:

1. Angles and parallel lines.
2. Signs of equality of triangles.
3. Sum of angles of a triangle.
4. Area of ​​a triangle and quadrilaterals.
5. Pythagorean theorem.
6. Similarity of triangles.
7. Circle, chords and tangents.
8. Coordinate geometry.
9. Vectors on a plane.
10. Basic stereometry.

## 15. Solution for current project

1. Do not clone PixelRAG inside Next.js and do not add its Python/GPU dependencies to the main deploy.
2. Create a separate directory `tools/content-ingestion` or a separate service after POC approval.
3. First, implement the canonical model and 20 of your own blueprints: without it, the PixelRAG results have nowhere to safely put.
4. Use PixelRAG only for authorized sources and editorial searches.
5. Do not copy Wordwall en masse. Repeat the breadth of topics, ease of search, and the idea of ​​reusing content, but fill the product with proprietary and licensed materials.

## 16. Technical references

- PixelRAG: <https://github.com/StarTrail-org/PixelRAG>
- PixelRAG license, Apache-2.0: <https://github.com/StarTrail-org/PixelRAG/blob/main/LICENSE>
- Wordwall Terms of Use: <https://wordwall.net/terms>
- Wordwall template system: <https://wordwall.net/en/features>
