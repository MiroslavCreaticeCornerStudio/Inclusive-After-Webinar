# Form Integrations — Zoom Webinar + Brevo

The "Кандидатствай сега" form (Final CTA section) submits to a server endpoint that
registers the applicant for a Zoom webinar **and** adds them to a Brevo contact list.

## Flow

```
FinalCta form  ──POST JSON──▶  /api/apply  ──▶  Zoom  (webinar registrant)
 (name, phone,                  (server         └──▶  Brevo (contact → list #9)
  email, consent)                function)
```

- Endpoint: [`src/pages/api/apply.ts`](src/pages/api/apply.ts) — `export const prerender = false`
  (runs as a serverless function; the rest of the site stays static).
- The endpoint validates input, then calls Zoom + Brevo in parallel. If **either** succeeds the
  lead is considered captured; failures are logged server-side (never the secrets).
- Zoom auth uses **Server-to-Server OAuth** — a fresh access token is fetched per request from the
  Account ID + Client ID + Client Secret (the short-lived token you also provided isn't needed).

## Environment variables

Set these in `.env` locally (gitignored) and in your host's dashboard for production.
See [`.env.example`](.env.example).

| Var | Notes |
|-----|-------|
| `ZOOM_ACCOUNT_ID` / `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` | Zoom S2S OAuth app |
| `ZOOM_WEBINAR_ID` | Webinar ID, spaces removed (`87979328808`) |
| `BREVO_API_KEY` | Brevo API key |
| `BREVO_LIST_ID` | Brevo list (default `9`) |

The Zoom app needs the **`webinar:write:registrant`** scope (verified present) and the webinar
must have **registration enabled** (verified — a test registrant was accepted).

## Deploying

Configured for **Vercel** (`@astrojs/vercel` adapter). To deploy:

1. `vercel` (or connect the Git repo in the Vercel dashboard).
2. Add all the env vars above under **Project → Settings → Environment Variables**.
3. Update `site` in `astro.config.mjs` to the real domain (also `public/robots.txt`).

Deploying elsewhere? Swap the adapter in `astro.config.mjs`:
`@astrojs/node` (`{ mode: 'standalone' }`) for any Node host, or `@astrojs/netlify` for Netlify.

## Behaviour notes

- **Phone → Brevo SMS**: normalized to E.164 (Bulgarian `+359` default). If Brevo rejects the
  format, the contact is still saved without the SMS field (automatic retry).
- **Duplicate email**: Brevo updates the existing contact (`updateEnabled: true`).
- **Diagnosing failures**: check the function logs (Vercel → Deployments → Functions, or the local
  `astro dev` console) for `[apply] Zoom failed:` / `[apply] Brevo failed:` lines.

## ⚠️ Test data to delete

End-to-end tests created two entries — please remove them from Zoom registrants and Brevo list #9:

- `inclusive.form.test@example.com` — "Тест Кандидатура"
- `inclusive.form.test2@example.com` — "Тест Браузър"

## ⚠️ Rotate the secrets

The Zoom Client Secret and Brevo API key were shared in plaintext. Rotate them
(Zoom Marketplace app → regenerate secret; Brevo → SMTP & API → regenerate key) and update `.env`
+ the host env vars.
