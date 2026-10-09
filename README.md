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

This is an English-language prototype. The full catalog has not undergone a complete pedagogical review.

## Development

Requires Node.js 24 or later and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Next.js. To validate a change:

```sh
npm run check:english
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

Hosted preview: https://lessonquest.rubackoff.chatgpt.site

The preview retains its existing owner-only access. The GitHub repository is public. See [English release and hosting notes](docs/ENGLISH-RELEASE.md) for scope, archived visual drafts, verification, and deployment details.

## Netlify deployment

The repository is ready for a native Next.js deployment on Netlify. Connect this GitHub repository, keep the Free plan, and use the settings in `netlify.toml`. No separate frontend build or game rewrite is required.

Netlify Database supplies persistent Postgres storage for published activities and attempts. The migration in `netlify/database/migrations/` is applied by Netlify during deployment; the database connection is provisioned automatically. Local development without Netlify still uses SQLite. A misconfigured Netlify environment fails instead of silently saving data to temporary SQLite storage.

Publication requires the project owner's Netlify login. A prepared build is not confirmation that a public deployment exists. After publication, check the homepage, Studio, a saved activity link, and result submission:

```sh
node hosting/sites/scripts/smoke-storage.mjs https://YOUR-PROJECT.netlify.app
```

The storage check creates its own test activity and removes it afterward.

### Free-plan budget

Checked against [Netlify pricing](https://www.netlify.com/pricing/) on October 9, 2026: the Free plan includes 300 credits per month. Production deploys cost 15 credits each, bandwidth 20 credits per GB, web requests 2 credits per 10,000, and function compute 10 credits per GB-hour. [Database compute](https://docs.netlify.com/build/data-and-storage/netlify-database/billing-and-usage/) costs 10 credits per compute-unit hour; the Free database sleeps after five idle minutes.

An illustrative month with three production deploys, 2 GB of total metered bandwidth, and five database compute-unit hours uses 135 credits before web requests, function compute, and any applicable database storage charge. This is a budget example, not a measured traffic guarantee. Check current storage pricing in the dashboard; the documentation still refers to an introductory storage period that has ended.

Most gameplay runs in the browser. Avoid frequent production deploys during a demo month, use previews for iteration, and check Usage & billing after initial testers. At the monthly limit Netlify pauses the projects until the next cycle; Free does not automatically charge for overages. AI-provider API usage is separate from this hosting estimate.
