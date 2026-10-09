# Beta Hosting

URL: https://corgi-trainer-beta.rubackoff.chatgpt.site

- Provider: Sites / Cloudflare Workers.
- Site ID: `appgprj_6ac16743d41c81918e7d2f6af2c30257`.
- Deployment ID: `appgdep_6ac16c5fd17081919fe62ae6d5e33ae4`.
- Published source: `d7f3965c3bcb9ed40405bc9e988fa6ce5552b268`.
- Access: private, owner-only. Do not widen access without a user request.
- Hosted checkout: `deploy/sites-beta`; its `.openai/hosting.json` is canonical.
- The local Next.js application remains in the workspace root.

The hosted copy uses the Sites Vinext adapter for the existing Next.js routes
and D1 for published activities and student attempts. Local SQLite data and
`.env` files were not uploaded. Trainer device-local records keep their existing
behavior. AI generation is unavailable until a server-side provider is configured.

For updates, reuse the same Site ID and hosted checkout. Synchronize relevant
UI changes from the local app while preserving the hosted database adapter and
async route calls. Apply database changes through new Drizzle migrations.
Verify the build and `scripts/smoke-storage.mjs` before publishing.

Windows packaging required native `tar` with a relative `dist` input and an ASCII
archive path. The artifact contains build output, hosting metadata, and migrations,
not local runtime data. Never put Git write credentials in files or shell arguments.
