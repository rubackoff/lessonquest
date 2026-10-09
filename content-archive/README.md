# Local archive of educational references

This catalog is intended for materials on all subjects: own, uploaded by tutors, openly licensed and individual references. The archive is separate from the product's public library.

## The main rule

The presence of a file in the local archive does not mean the right to publish it in the product.

- `publish-with-attribution`: publication permitted with indication of the author and license;
- `adapt-after-redraw`: allowed to use the idea and structure after re-formulating and creating your own visual;
- `reference-only`: reference, notes and internal study only; automatic bulk capture and publication are prohibited.

Material `reference-only` can't get status `publishable`. This limitation is fixed in JSON Schema.

But using such material you can immediately create a **separate independent remake**. It requires new wording, dataset, visual materials and composition. The detailed clean-room process is described in [`ORIGINAL_REMAKE_RULES.md`](./ORIGINAL_REMAKE_RULES.md).

## Structure

```text
content-archive/
  archive.config.json general rules and versions
  taxonomy/subjects.json subjects and large sections
  schemas/archive-manifest.schema.json
  manifests/archive.example.json example of a valid manifest
  manifests/*.local.json local manifests, do not end up in git
  raw/ allowed source files
  tiles/                              screenshot tiles PixelRAG
  index/ local FAISS/Qdrant export
```

`raw`, `tiles`, `index` and local manifests are excluded from git. This protects tutors' personal materials and does not bloat the main repository.

## Supported subject areas

Taxonomy is not limited to geometry. The starting list includes:

- preschool development and primary school;
- Russian language and literature;
- English, German, French, Spanish and Chinese;
- arithmetic, algebra, geometry, probability and statistics;
- computer science;
- physics, chemistry, biology, ecology and astronomy;
- geography, history, social studies, economics and law;
- art and music;
- professional and adult courses.

A new item is added to `taxonomy/subjects.json`, and not sewn into a specific game.

## Workflow

### 1. Register source

Before downloading files, the owner, license, permitted actions and method of obtaining are indicated. For closed platforms, without written permission, only `reference-link`: URL, short notes on mechanics and subject tags.

### 2. Save authorized original

The file is placed in:

```text
raw/<source-id>/<document-id>/
```

For student or tutor materials, personal data cannot be stored in the file name and metadata.

### 3. Create a visual index

PixelRAG only applies if `indexAllowed` at the source is equal `true`:

```text
raw -> pixelshot -> tiles -> PixelRAG -> index
```

For small POC, FAISS is used. The general editorial index is later transferred to Qdrant.

### 4. Extract candidate

VLM returns a structured draft:

- condition;
- answer;
- explanation;
- images or description of the drawing;
- subject and topic;
- age or class;
- suitable game mechanics;
- retrieval confidence.

The draft is not published automatically.

### 5. Redraw and reformulate

For `adapt-after-redraw` are created:

- new wording;
- custom SVG, `GeometryScene`, graph or illustration;
- new incorrect options;
- own explanation;
- link to the reference used in the editorial journal.

The new visual is stored separately from the original file and inherits the style of our design system.

The reference is not transferred to a new status. A second record is created with `originality.mode: independent-remake` and link `inspiredByItemIds`. So the closed source remains `reference-only`, and independent work undergoes a separate review.

### 6. Check

Three statuses are required for publication:

- `rightsReview: passed`;
- `subjectReview: passed`;
- `visualReview: passed`.

For computational subjects, a machine check of the answer and the option generator is additionally performed.

### 7. Adapt to games

One material can provide several lessons:

- term and image -> “Pairs”;
- classification -> “Grouping”;
- question and options -> “Quiz”;
- wrong solution -> “Find the error”;
- rule and example -> “Memory Deck”;
- computational task -> arcade mechanics.

## Wordwall and other closed platforms

For such services, we archive not the content database, but a reference map:

- Public page URL;
- item;
- topic;
- mechanics used;
- what is convenient in the task;
- what needs to be improved;
- redraw brief without copying text and images.

Bulk automatic uploading through your account is not included in this process. To import real content, you need official export, permission from the author or an agreement with the platform.

## Next implementation

1. Source registration and manifest verification CLI.
2. PixelRAG POC on proprietary and openly licensed PDFs.
3. General model `CanonicalExercise` for all items.
4. Editorial queue “source -> draft -> redrawing -> review”.
5. The first subject packages: mathematics, languages ​​and natural sciences.
