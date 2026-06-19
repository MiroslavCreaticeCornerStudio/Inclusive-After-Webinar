---
description: Set up Keystatic CMS for the current project (Astro or Next.js) — installs packages, writes config, scaffolds Admin UI, wires images, and renders example content end-to-end
argument-hint: [collection-names?]
---

Set up Keystatic CMS for this project.

Args (optional): $ARGUMENTS

Delegate to the `keystatic-setup` agent:

```
Agent(
  subagent_type="keystatic-setup",
  description="Set up Keystatic CMS",
  prompt="Set up Keystatic for the current project end-to-end. Detect the framework (Astro or Next.js), install dependencies, write keystatic.config.ts, scaffold the Admin UI route, configure image fields for the correct location (src/assets for Astro Image, public/ for Next.js), and wire at least one example page so the read loop is proven before reporting done. If PROJECT_BRIEF.md exists, use it to suggest collection schemas instead of just installing the boilerplate posts collection. If the user passed collection names as arguments — '$ARGUMENTS' — create one collection() per name with sensible default fields (slug, date, summary, coverImage, content). Default storage to 'local' unless the user asked otherwise. Follow .claude/agents/keystatic-setup/AGENT.md exactly."
)
```

After the agent finishes, summarize for the user:
- Framework + storage mode
- Collections created (names only)
- Admin UI URL
- The example page that proves the loop works
- One-line "next step" suggestion (switch to GitHub for prod, or add more fields)
