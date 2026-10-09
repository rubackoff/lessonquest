# Rules for self-remake using reference

This is a workflow for situations where we like the teaching idea or mechanics of an external assignment, but do not have a license to copy its text and visuals.

This document does not constitute legal advice. It sets conservative product rules that reduce the risk of copying while allowing you to quickly create your own material.

## What can be transferred as an idea

- educational goal: for example, distinguish between tenses of the English language;
- a well-known fact, formula or rule;
- abstract game mechanics: match, sort, select, find an error;
- general type of task: find an unknown corner, arrange events, assemble a food chain;
- curriculum requirements;
- observations about the usability and shortcomings of UX.

## What can be used directly without pointless redrawing

- individual words and short captions: “circle”, `triangle`, "radius";
- standard geometric shapes and lines;
- generally accepted mathematical symbols and formulas;
- well-known facts and definitions, if we do not copy the author’s detailed formulation;
- common letter symbols for points, angles and sides;
- standard UI symbols and functional elements;
- the mechanics of the game itself and the sequence of player actions.

For such material there is no need to artificially change a circle into an oval or the word “square” into a synonym. A new author's contribution is created at the level of a set of tasks, explanations, illustrative system, composition and behavior of the game.

A separate issue is the mass extraction of a ready-made collection. Even if each individual fact or word is not protected, the selection and structure of a large database can be independently protected, and access to the platform is governed by its terms. Therefore, our packages are assembled from the subject program and our own generators, rather than being copied line by line from one external collection.

## What we do not transfer without permission

- exact or slightly rearranged wording;
- the same set of examples in the same order;
- typical incorrect answers;
- illustrations, photographs, screenshots and characters;
- tracing the original drawing;
- recognizable one-to-one screen composition;
- sounds, music, animation scenes and branding;
- proprietary code or platform network data.

Simply changing the color, font, or art style does not make the copy stand alone.

## Clean-room process

### Step 1. Analysis card

The person or agent who saw the reference writes down only abstract characteristics:

```text
Subject: English
Skill: distinguish Present Perfect from Past Simple
Mechanics: distribution of examples into two groups
Strength: Quick round and instant feedback
Problem: the cards are too monotonous
New idea: sorting messages inside an animated chat
```

Source texts and images are not inserted into the card.

### Step 2. Independent creation

The new author receives:

- analysis card;
- curriculum requirements;
- our design system;
- permitted subject sources.

It does not receive a screenshot of the external game as a template for tracing. The author creates a new dataset, wording, visual metaphor and composition.

### Step 3. Subject check

- correctness of the task and answer;
- lack of ambiguity;
- compliance with the level;
- usefulness of explanation;
- variety of examples.

### Step 4: Testing your independence

For `independent-remake` answers are required `false`:

- `copiedText`;
- `copiedMedia`;
- `copiedLayout`.

And at least four elements from the list must be created:

- new condition;
- new dataset;
- new answer options;
- new explanation;
- new visual materials;
- new composition;
- new animation;
- new sound.

### Step 5. Individual entries

Reference and new material are always different entries:

```text
reference item
  publishPolicy: reference-only
  workflowStatus: registered

original remake
  publishPolicy: adapt-after-redraw
  originality.mode: independent-remake
  originality.inspiredByItemIds: [reference item id]
```

The original entry never becomes publishable. Only new material can be published after three checks.

## Minimum distance from reference

Before publication the following must be changed at the same time:

1. Formulation and data set.
2. Visual objects and illustrations.
3. Composition of a card or game scene.
4. Feedback and movement.

For educational facts, the meaning is preserved, but not the specific author’s expression.

## Examples

### Acceptable stand-alone remake

The reference uses the “animal picture ↔ name” mechanics. We create our own set of cell anatomy, draw new organelles in a single SVG system, add captions, explanations and connection animations.

### Insufficient recycling

We take the same eight animals, the same order, repeat the silhouettes, change the background from blue to purple and round out the cards. This stays too close to the source.

### Acceptable Use of Teaching Fact

The fact “the sum of the angles of a triangle is 180°” is not borrowed from a specific platform. We create a new condition, parameters, drawing, incorrect options and explanation.

## Automatic check in the future

- text similarity: n-gram and embedding similarity;
- visual proximity: perceptual hash and vision embedding;
- matching card order;
- matching number sets and incorrect options;
- Manual viewing of high proximity materials.

Automatic verification does not solve the legal issue, but it is good at catching lazy “repaints” before publication.
