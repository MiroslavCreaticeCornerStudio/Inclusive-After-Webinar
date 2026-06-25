# Form Integrations — Brevo + Skyguru CRM

The "Стани част от печелившия отбор!" form (Final CTA section) captures leads into
**Brevo** (a contact list) and forwards them to the **Skyguru CRM**, with Facebook/UTM
attribution. On success the visitor is sent to a `/thank-you` confirmation page.

> Zoom webinar registration was removed (no active webinar). The form is now pure lead capture.

## Flow

```
FinalCta form ──POST JSON──▶ /api/apply (server fn) ──▶ Brevo  (contact → list #9)
 (name, phone,                                        └──▶ Skyguru CRM (best-effort)
  email, consent,
  + fbclid/UTM)        success ──▶ redirect to /thank-you
```

- Endpoint: [`src/pages/api/apply.ts`](src/pages/api/apply.ts) — `export const prerender = false`
  (serverless function; the rest of the site stays static).
- CRM forward: [`src/lib/crm.ts`](src/lib/crm.ts) — best-effort, never blocks the Brevo capture.
- Brevo write uses a tiered attribute fallback so a missing attribute never costs the lead.

## Environment variables

Set in `.env` locally (gitignored) and in the host dashboard for production. See
[`.env.example`](.env.example).

| Var | Required | Notes |
|-----|----------|-------|
| `BREVO_API_KEY` | yes | Brevo API key |
| `BREVO_LIST_ID` | yes | Brevo list (default `9`) |
| `CRM_ENDPOINT` | no | Defaults to `https://inclusive.skyguru.ai/api/v1/public/leads` |
| `SKYGURU_API_KEY` | no | Bearer token for the CRM, only if it requires auth |

## Brevo contact fields written

| Brevo attribute | Source |
|---|---|
| `FIRSTNAME` | the name field |
| `TELEFON` | raw phone (text) |
| `SMS` | normalized phone (best-effort; dropped if Brevo rejects the format) |
| `FBCLID`, `UTM_SOURCE`, `UTM_MEDIUM`, `UTM_CAMPAIGN`, `UTM_TERM`, `UTM_CONTENT` | from the ad URL |
| `AD_TIMESTAMP`, `LANDING_PAGE` | fb click time + landing URL |

Facebook/UTM params are captured on page load in `BaseLayout.astro` (→ `localStorage`) and
attached to the submission.

## Behaviour notes

- **Diagnosing failures**: check the function logs (Vercel → Deployments → Functions, or the
  local `astro dev` console) for `Brevo error` / `CRM error` lines.
- **No-JS fallback**: the endpoint also accepts form-encoded posts.

## ⚠️ Test data to delete

End-to-end tests created these — remove from Brevo list #9 (and Skyguru CRM where noted):

- `inclusive.form.test@example.com` — "Тест Кандидатура"
- `inclusive.form.test2@example.com` — "Тест Браузър"
- `inclusive.zoomlink.test@example.com` — "Тест ЗумЛинк"
- `inclusive.formlogic.test@example.com` — "Тест ФормЛогика" (Brevo + Skyguru CRM)

## ⚠️ Rotate the secrets

The Brevo API key was shared in plaintext during setup. Rotate it (Brevo → SMTP & API →
regenerate) and update `.env` + the host env vars.
