// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// IMPORTANT: update `site` to the real production domain before deploying —
// canonical URLs, Open Graph URLs, and the sitemap all derive from it.
//
// The marketing page stays static; only `/api/apply` runs as a server function
// (it has `export const prerender = false`). The adapter below enables that.
// Deploying somewhere other than Vercel? Swap `@astrojs/vercel` for
// `@astrojs/node` ({ mode: 'standalone' }) or `@astrojs/netlify`.
export default defineConfig({
  site: 'https://inclusive.bg',
  adapter: vercel(),
  integrations: [sitemap()],
  env: {
    schema: {
      ZOOM_ACCOUNT_ID: envField.string({ context: 'server', access: 'secret' }),
      ZOOM_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
      ZOOM_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
      ZOOM_WEBINAR_ID: envField.string({ context: 'server', access: 'secret' }),
      BREVO_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      BREVO_LIST_ID: envField.number({ context: 'server', access: 'secret', default: 9 }),
    },
  },
});
