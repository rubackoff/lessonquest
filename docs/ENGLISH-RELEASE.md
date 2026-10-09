# English edition

The public edition uses the LessonQuest name and English interface, instructions, feedback, documentation, and source comments. Language Arts exercises were adapted to English spelling, subject–verb agreement, word stress, and word meanings. English vocabulary activities match words to definitions rather than translated copies of the same word.

The shared avatar assets and browser storage keys are retained. A new domain has its own browser storage: an existing character selection or progress on localhost is not automatically transferred to the hosted site.

## Repository scope

The repository contains the authored application, playable scenarios, source assets, asset attribution, build scripts, specifications, and hosting adapter. Local databases, credentials, dependency caches, downloaded teaching archives, temporary recordings, and historical QA output are excluded.

Historical concept images containing embedded legacy interface text remain in the local project archive. The exact excluded paths are listed in `.gitignore`. Some historical design notes reference those local images. Runtime illustrations were reviewed separately; the pendulum workshop and coach artwork were updated for the English edition.

## Verification

- 404 tests across 26 files passed before the final hosting integration.
- All 2,766 generated and authored library variants passed editor validation.
- Accidental identical vocabulary pairs were replaced with definitions; the valid derivative pair `eˣ → eˣ` is retained.
- The `check:english` command scans repository filenames and text for Cyrillic characters. It cannot inspect lettering baked into images or establish linguistic quality.
- Desktop and narrow-screen browser checks cover representative routes and interactions. This is a prototype, and the complete catalog has not undergone a full pedagogical review.

## Hosting

The hosted edition uses the existing Sites project with Cloudflare Workers and D1. The current Site audience is retained. GitHub repository visibility and Site visitor access are separate settings.

`hosting/sites/` contains the retained runtime configuration and the D1 repository adapter. After opening a registered Site checkout, run:

```sh
node scripts/prepare-hosting.mjs /absolute/path/to/opened-sites-checkout
```

This copies the application and hosting adapter, preserves the Site identity, and records the GitHub source commit in `SOURCE.json`. It does not install dependencies, deploy, modify cloud records, or grant visitor access. Use the Sites installation, build, and publication workflow from that checkout. `scripts/smoke-storage.mjs` in the prepared checkout tests local activity creation, attempts, deletion, and cascading cleanup against a local preview.

For an independent hosting account, Cloudflare Workers and D1 have free tiers subject to quotas. A separate deployment needs its own database, bindings, migration setup, and access controls; the Sites configuration is not a one-click public Cloudflare deployment. GitHub Pages cannot run this application's server APIs.

Official references: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/). Vercel's [Hobby plan](https://vercel.com/docs/plans/hobby) is restricted to personal, non-commercial use. These provider terms do not describe the billing or quotas of Sites itself.
