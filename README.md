# LessonQuest

Interactive learning through short games, practical challenges, and tutor-led adventures.

LessonQuest is a prototype platform for practice in mathematics, science, language arts, and English. A student can start a short activity during a lesson and continue practicing independently. Shared characters, achievements, and cosmetic unlocks connect the activities.

## What's inside

- Practice templates: matching, sorting, quizzes, recall cards, error diagnosis, and a force laboratory.
- Space Maze, Orbital Runner, and Base Defense with educational objectives and shared avatars.
- A mechanics playground with 100 authored scenarios across multiple subjects. Several scenarios have dedicated interactions; others share reusable engines. This is not a claim of 100 distinct game engines.
- Geometry expeditions, an interactive English guest room, and an airport luggage investigation.
- A pendulum laboratory and lesson-authoring prototypes.
- Design specifications, asset sources, and implementation notes.

The English edition is being prepared for its first public release. Do not treat a successful build as evidence that every learning activity has been reviewed by a teacher.

## Development

Requires Node.js 24 or later and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Next.js. To validate a change:

```sh
npm run test
npm run lint
npm run typecheck
npm run build
```

Local published activities and attempts use SQLite in `data/`. Browser progress and character choices are stored on the current device and origin. Moving to another domain does not transfer those browser saves automatically.

## Configuration

AI generation is optional. Without a configured provider, the authored examples and games remain available. Never commit API keys or local databases. See `.env.example` for server configuration names.

## Assets and source material

Keep third-party attribution alongside the corresponding assets. Source notes are in `assets/`, `third-party/`, and `docs/asset-provenance/`. Raw imported teaching archives, temporary downloads, recordings, and historical QA screenshots are local working material and are not part of the public application.

## Release status

Repository: https://github.com/rubackoff/lessonquest

Public deployment is pending the English content and behavior checks. Hosting instructions will be added with the first verified deployment.
