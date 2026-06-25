// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// IMPORTANT: update `site` to the real production domain before deploying —
// canonical URLs, Open Graph URLs, and the sitemap all derive from it.
//
// The marketing page stays static; only `/api/apply` runs as a server function
// (it has `export const prerender = false`). The adapter below enables that.
// Deploying somewhere other than Vercel? Swap `@astrojs/vercel` for
// `@astrojs/node` ({ mode: 'standalone' }) or `@astrojs/netlify`.
//
// Server secrets are read at runtime via `getSecret()` from `astro:env/server`
// (in src/lib/zoom.ts, src/lib/crm.ts, src/pages/api/apply.ts) — no schema needed.
export default defineConfig({
  // Served as a subpath of the webinar host: https://webinar.inclusive.bg/careers
  // `base` makes every emitted route + bundled asset live under /careers so they
  // don't collide with the other project sitting at the domain root. The main
  // project rewrites /careers/* to this deployment.
  site: 'https://webinar.inclusive.bg',
  base: '/careers',
  adapter: vercel(),
  integrations: [sitemap()],
});
