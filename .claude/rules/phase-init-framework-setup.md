---
description: Pre-flight rule for `/brief` and `/build` — detects the user's framework, asks them to pick one if none exists, and scaffolds it
---

# Framework Setup (runs before Phase 0)

Every `/brief` or `/build` invocation must start with this check. **Do not skip it** — Phase 0 writes design tokens to `global.css` in the framework's expected location, and that location depends on which framework is in use.

## Step 1 — Detect the framework

Inspect the current working directory:

1. Look for `package.json`. If it doesn't exist → **no framework** → go to Step 2.
2. If `package.json` exists, read its `dependencies` and `devDependencies`. Map to a framework:
   - `astro` → **Astro**
   - `next` → **Next.js**
   - `nuxt` → **Nuxt**
   - `@sveltejs/kit` → **SvelteKit**
   - `vite` + (`react` or `react-dom`) → **Vite + React**
   - `vite` + `vue` → **Vite + Vue**
   - `vite` + `svelte` (without `@sveltejs/kit`) → **Vite + Svelte**
3. If a framework is detected → record it for later phases (use it to resolve paths like the components dir, root layout, static assets folder, global stylesheet) → proceed to Phase 0.
4. If `package.json` exists but no recognized framework is found → ask the user before proceeding (they may have a custom setup).

## Step 2 — Ask the user (only when no framework detected)

Present the user with this exact question (use `AskUserQuestion` if available):

> **No framework detected in this directory. Which would you like to use?**
>
> Pick based on what you're building:
>
> - **Astro** *(recommended for marketing sites, landing pages, blogs, portfolios, agency sites)* — Static-first, ships almost no JavaScript by default → fast page loads and great SEO. Built-in image optimization, sitemap, RSS. Best for content-heavy or brochure-style sites.
>
> - **Next.js** *(recommended for web apps, dashboards, SaaS, anything with login/user accounts/dynamic data)* — Full React framework with Server Components, Server Actions, API routes, middleware, edge runtime. Best when you need real interactivity and a backend.
>
> - **Other** — Vite/React, SvelteKit, Vue/Nuxt, or something else. Tell me which.

**Default recommendation logic** (only volunteer this if the user is unsure):
- If their Figma file is mostly content sections (hero, features, testimonials, footer) → recommend **Astro**.
- If their Figma file shows app-like UI (sign-in screens, dashboards, tables, settings panels) → recommend **Next.js**.

## Step 3 — Scaffold the chosen framework into the current directory

The current directory already contains this starter's files (`.claude/`, `global.css`, `README.md`, `CLAUDE.md`, `DESIGN-SYSTEM.md`, `best-practice/`). The scaffolding command must run **inside this directory** and merge with existing files (it should not wipe them).

Use the appropriate command for the chosen framework. **Always confirm with the user before running** — they may want to change defaults.

| Framework | Scaffold command |
|---|---|
| Astro | `npm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston --yes` |
| Next.js | `npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --no-git --use-npm --yes` |
| Nuxt | `npx nuxi@latest init . --packageManager npm --gitInit false --force` |
| SvelteKit | `npm create svelte@latest .` (interactive — pass user through the prompts) |
| Vite + React | `npm create vite@latest . -- --template react-ts` |
| Vite + Vue | `npm create vite@latest . -- --template vue-ts` |

If the scaffolder refuses to run in a non-empty directory:
- Inspect what's blocking it (e.g., a `.gitignore` collision)
- Move conflicting files to a `_starter-backup/` folder, scaffold, then merge them back manually if needed
- Never delete `.claude/`, `README.md`, `CLAUDE.md`, `DESIGN-SYSTEM.md`, `global.css`, or `best-practice/`

After scaffolding completes, install dependencies if the scaffolder didn't (`npm install`).

## Step 4 — Integrate `global.css` into the framework

Move the starter's root-level `global.css` into the framework's expected location, and import it from the root layout so it loads on every page.

| Framework | Move to | Import from |
|---|---|---|
| Astro | `src/styles/global.css` | `src/layouts/BaseLayout.astro` (or wherever the head lives): `import "../styles/global.css";` in the frontmatter |
| Next.js (App Router) | `app/globals.css` | `app/layout.tsx`: `import "./globals.css";` (the scaffolder usually adds this automatically — verify) |
| Nuxt | `assets/css/global.css` | `nuxt.config.ts`: add to `css: ['~/assets/css/global.css']` |
| SvelteKit | `src/app.css` | `src/routes/+layout.svelte`: `import '../app.css';` in the `<script>` block |
| Vite + React | `src/styles/global.css` | `src/main.tsx`: `import "./styles/global.css";` |
| Vite + Vue | `src/styles/global.css` | `src/main.ts`: `import "./styles/global.css";` |

Verify the import landed by running the framework's dev server briefly (e.g., `npm run dev`), confirming the page loads, then stopping it.

## Step 5 — Confirm and proceed

Tell the user:
- Which framework was detected/scaffolded
- Where `global.css` now lives
- That the pipeline is moving on to Phase 0

Then continue with Phase 0 (Project Brief).

## Skip conditions

Skip this whole rule if:
- A framework was already detected in Step 1 → just proceed to Phase 0
- The user explicitly says "skip setup" or "framework is already configured"

Never skip the framework-detection step itself — Phase 0 needs to know where to write `global.css`.
