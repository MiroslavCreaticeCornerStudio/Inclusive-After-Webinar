---
description: Submit URLs to Google's Indexing API for rapid indexing. Use when the user publishes new content, updates existing pages, asks to "index this page", "submit to Google", "speed up indexing", or wants Google to crawl a URL immediately.
---

# Google Indexing API

You are helping the user submit URLs to Google's Indexing API so Google discovers and indexes them faster — usually within hours instead of days or weeks.

## How it works

Run the indexing script via Bash:

```
node .claude/scripts/google-index.js <url1> [url2] [url3] ...
```

## First time: check if credentials exist

Before running, check whether `.google-indexing-key.json` exists in the project root OR whether `GOOGLE_INDEXING_KEY_PATH` is set in the environment.

If neither exists, walk the user through one-time setup:

---

### One-Time Setup (do this once per site)

Tell the user:

**Step 1 — Create a Google Cloud project**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click "New Project" → name it anything (e.g., "SEO Indexing")
3. Select that project

**Step 2 — Enable the Indexing API**
1. In the left menu → APIs & Services → Library
2. Search "Web Search Indexing API"
3. Click it → Enable

**Step 3 — Create a Service Account**
1. APIs & Services → Credentials → Create Credentials → Service Account
2. Name it anything (e.g., "indexing-bot")
3. Click Create → skip optional steps → Done
4. Click the service account in the list → Keys tab → Add Key → JSON
5. Save the downloaded JSON file as `.google-indexing-key.json` in the project root
6. Add `.google-indexing-key.json` to `.gitignore` — never commit this file

**Step 4 — Grant access in Search Console**
1. Open the JSON key file and copy the `client_email` value (looks like: name@project.iam.gserviceaccount.com)
2. Go to [Google Search Console](https://search.google.com/search-console) → select your property
3. Settings (gear icon) → Users and permissions → Add User
4. Paste the service account email → set permission to **Owner** → Add

Setup is complete. Run the command once with any URL to confirm it works.

---

## Running the indexer

Once credentials are in place, submit URLs:

```bash
node .claude/scripts/google-index.js https://yourdomain.com/new-article
```

Multiple URLs at once:
```bash
node .claude/scripts/google-index.js \
  https://yourdomain.com/page1 \
  https://yourdomain.com/page2 \
  https://yourdomain.com/page3
```

## Interpreting results

- `✅  URL` — Google accepted the submission. Indexing typically happens within a few hours.
- `❌  URL` with `403 Forbidden` — The service account isn't added as Owner in Search Console. Complete Step 4 above.
- `❌  URL` with `400 Invalid URL` — The URL format is wrong or the domain doesn't match the Search Console property.
- `❌  URL` with `429 Too Many Requests` — You've hit the daily quota (200 URLs/day per project).

## Quota limits

Google allows **200 URL submissions per day** per Cloud project. For larger sites, create multiple Cloud projects each with their own service account.

## When to use

- After publishing a new article or page
- After updating an important page (new content, changed URL, added schema)
- After doing a site migration or URL restructure
- Whenever you want Google to pick up changes quickly

## What NOT to use it for

Don't submit every page on a large site at once — Google will still crawl at its own pace. Submit only new and recently changed pages. Submitting unchanged pages wastes your daily quota.
