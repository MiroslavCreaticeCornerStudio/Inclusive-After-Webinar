---
paths:
  - "keystatic.config.ts"
  - "keystatic.config.tsx"
  - "src/keystatic.config.ts"
  - "app/keystatic/**"
  - "src/app/keystatic/**"
  - "app/api/keystatic/**"
  - "src/app/api/keystatic/**"
  - "src/pages/keystatic/**"
  - "src/pages/api/keystatic/**"
---

# Keystatic Reference

Comprehensive reference for working with Keystatic CMS. Loaded automatically when any file matching the paths above is opened or edited. For the end-to-end setup walkthrough, see `.claude/agents/keystatic-setup/AGENT.md` or run `/keystatic`.

Keystatic is a Git-based CMS — content lives in the repo as Markdown/MDX/Markdoc/JSON/YAML. Editors get a typed UI; the schema is the contract. No database, no API to call, no vendor lock-in.

---

## Packages

| Package | What it does | When to install |
|---|---|---|
| `@keystatic/core` | Field/collection/config primitives + Reader API | Always |
| `@keystatic/astro` | Astro integration (mounts the Admin UI route) | Astro projects |
| `@keystatic/next` | Next.js helpers (`makePage`, `makeRouteHandler`) | Next.js projects |
| `@markdoc/markdoc` | Markdoc renderer | If using `fields.markdoc` and rendering on the server |
| `@astrojs/react` | React adapter for Astro | Astro projects (Keystatic UI is React) |
| `@astrojs/markdoc` | Astro Markdoc integration | Astro projects using `fields.markdoc` |

---

## `config()`

```typescript
import { config, collection, singleton, fields } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },        // 'local' | 'github' | 'cloud'
  ui: { brand: { name: 'My Site' } },
  collections: { /* ... */ },
  singletons: { /* ... */ },
  // Optional:
  // cloud: { project: 'team/project' },
  // locale: 'en-US',
});
```

### Storage modes

```typescript
// Local — writes to filesystem. Default for development.
storage: { kind: 'local' }

// GitHub — writes commits to a GitHub repo via a GitHub App.
storage: {
  kind: 'github',
  repo: 'owner/repo',
  // Optional: only show branches matching this prefix in the UI
  // branchPrefix: 'cms/',
}

// Keystatic Cloud — hosted auth (3 free editors) + image hosting
storage: { kind: 'cloud' }
// Also requires: cloud: { project: 'team/project' }
```

**Local → GitHub migration:** swap the `storage` block and visit `/keystatic` again. Keystatic walks the user through creating a GitHub App. Four env vars get written:

```bash
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
# Astro:
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
# Next.js:
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
```

Copy those into the deploy host's environment.

---

## `collection()` — repeatable content

```typescript
collection({
  label: 'Posts',                          // Required. UI label.
  slugField: 'title',                      // Required. Which schema field generates the slug.
  path: 'src/content/posts/*',             // Required. Where entries live. `*` is the slug.
  format: { contentField: 'content' },     // Optional. Which field is the body of the Markdown file.
  entryLayout: 'content',                  // 'form' (default) | 'content' (full-width editor)
  columns: ['title', 'publishedDate'],     // Optional. Fields shown in the list view.
  previewUrl: 'http://localhost:4321/posts/{slug}', // Optional. Adds a "Preview" button in the UI.
  parseSlugForSort: (slug) => slug,        // Optional. Transform slugs for sorting.
  template: 'template-entry',              // Optional. Use an existing entry as a new-entry template.
  schema: { /* fields go here */ },        // Required.
})
```

**Format options:**

```typescript
// Markdown body with frontmatter (Markdoc syntax):
format: { contentField: 'content' }

// All-JSON entries (no body):
format: 'json'

// All-YAML entries:
format: 'yaml'

// Custom data file format:
format: { data: 'yaml' }
```

The `path` pattern controls where files land. `src/content/posts/*` means each entry becomes `src/content/posts/<slug>.md` (or `.mdx`/`.yaml` etc. based on format). Use `src/content/posts/**` if entries should live in subfolders per slug (`src/content/posts/<slug>/index.md`) — required if entries have nested image fields.

---

## `singleton()` — one-off content

```typescript
singleton({
  label: 'Site settings',
  path: 'src/content/site/',
  schema: {
    siteTitle: fields.text({ label: 'Site title' }),
    description: fields.text({ label: 'Description', multiline: true }),
    logo: fields.image({
      label: 'Logo',
      directory: 'src/assets/site',
      publicPath: '@assets/site/',
    }),
  },
})
```

Use for: site settings, homepage hero, about page, footer content, anything that exists exactly once.

---

## Field reference

All fields come from `import { fields } from '@keystatic/core'`. Common pattern: every field takes a `{ label }` and optional `description`, `defaultValue`, and `validation`.

### Strings

```typescript
fields.text({ label: 'Title' })
fields.text({ label: 'Body', multiline: true })
fields.text({ label: 'Tagline', validation: { length: { min: 4, max: 80 } } })
fields.text({ label: 'Slug', validation: { isRequired: true } })

fields.slug({
  name: { label: 'Title', validation: { length: { min: 4 } } },
  // The slug is auto-generated from name. Override pattern with `slug.generate`.
})

fields.url({ label: 'Website' })
```

### Numbers, booleans, dates

```typescript
fields.integer({ label: 'Year' })
fields.number({ label: 'Price' })
fields.checkbox({ label: 'Featured', defaultValue: false })
fields.date({ label: 'Published', defaultValue: { kind: 'now' } })
fields.datetime({ label: 'Event start' })
```

### Choices

```typescript
fields.select({
  label: 'Status',
  defaultValue: 'draft',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
  ],
})

fields.multiselect({
  label: 'Tags',
  options: [
    { label: 'Engineering', value: 'engineering' },
    { label: 'Design', value: 'design' },
  ],
})

fields.conditional(
  fields.checkbox({ label: 'External link?' }),
  {
    true: fields.url({ label: 'External URL' }),
    false: fields.relationship({ label: 'Internal page', collection: 'pages' }),
  },
)
```

### Images and files

```typescript
// Astro — images that need <Image /> processing must live in src/
fields.image({
  label: 'Cover',
  directory: 'src/assets/images/posts',
  publicPath: '@assets/images/posts/',
  validation: { isRequired: true },
})

// Next.js — typically served from public/
fields.image({
  label: 'Cover',
  directory: 'public/images/posts',
  publicPath: '/images/posts/',
})

fields.file({
  label: 'Resume',
  directory: 'public/files',
  publicPath: '/files/',
})
```

**Astro image caveat:** for images referenced inside MDX/Markdoc *content components* (not top-level fields), `publicPath` **must start with `/src/`** for Astro's dynamic import to work. Top-level image fields can use a path alias like `@assets/`.

### Long-form content

```typescript
// Markdoc — Markdown + custom tags, parseable to AST
fields.markdoc({
  label: 'Body',
  options: {
    image: {
      directory: 'src/assets/images/posts',
      publicPath: '@assets/images/posts/',
    },
  },
})

// MDX — Markdown + JSX. Use when you need React components inline.
fields.mdx({ label: 'Body' })

// Keystatic document — rich text stored as JSON. No Markdown round-trip.
// Best when you only render through Keystatic's renderer, not via Markdown tools.
fields.document({
  label: 'Body',
  formatting: true,
  links: true,
  images: { directory: 'src/assets/images', publicPath: '@assets/images/' },
})
```

### Grouping

```typescript
// object: a fixed group of named fields
fields.object({
  seo: fields.object({
    title: fields.text({ label: 'SEO title' }),
    description: fields.text({ label: 'SEO description', multiline: true }),
    ogImage: fields.image({
      label: 'OG image',
      directory: 'src/assets/images/og',
      publicPath: '@assets/images/og/',
    }),
  }),
})

// array: repeating items
fields.array(
  fields.object({
    question: fields.text({ label: 'Question' }),
    answer: fields.text({ label: 'Answer', multiline: true }),
  }),
  {
    label: 'FAQ',
    itemLabel: (props) => props.fields.question.value,
  },
)

// blocks: array where each item picks from multiple object shapes
// Great for page builders / flexible sections.
fields.blocks({
  hero: {
    label: 'Hero',
    schema: fields.object({
      heading: fields.text({ label: 'Heading' }),
      cta: fields.text({ label: 'CTA label' }),
    }),
  },
  features: {
    label: 'Features grid',
    schema: fields.object({
      items: fields.array(
        fields.object({
          title: fields.text({ label: 'Title' }),
          icon: fields.text({ label: 'Icon name' }),
        }),
      ),
    }),
  },
}, { label: 'Sections' })
```

### Cross-collection relationships

```typescript
fields.relationship({
  label: 'Author',
  collection: 'authors',
  validation: { isRequired: true },
})

// Many-to-many: array of relationship
fields.array(
  fields.relationship({ label: 'Related post', collection: 'posts' }),
  { label: 'Related posts' },
)
```

---

## Reading content

### Astro — use Astro Content Collections (recommended)

Define the matching collection in `src/content.config.ts` (Astro 5) or `src/content/config.ts` (Astro ≤4):

```typescript
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    publishedDate: z.coerce.date(),
    summary: z.string(),
    coverImage: image().optional(),
  }),
});

export const collections = { posts };
```

Then in a page:

```astro
---
import { getCollection, getEntry } from 'astro:content';
import { Image } from 'astro:assets';

const posts = await getCollection('posts');
const post = await getEntry('posts', Astro.params.slug);
const { Content } = await post.render();
---
<Image src={post.data.coverImage} alt="" width={1200} height={630} />
<Content />
```

`image()` in the schema is what makes Keystatic's `@assets/...` paths resolve into optimizable `ImageMetadata`.

### Next.js — use the Reader API

```typescript
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

// All entries (lightweight — just metadata)
const posts = await reader.collections.posts.all();

// Single entry
const post = await reader.collections.posts.read('my-post');

// Single entry with content body resolved
const post = await reader.collections.posts.read('my-post', { resolveLinkedFiles: true });
const body = await post.content();   // Markdoc AST node

// Just the slug list (cheap)
const slugs = await reader.collections.posts.list();

// Singletons
const site = await reader.singletons.site.read();
```

**Rendering a Markdoc body in React:**

```typescript
import Markdoc from '@markdoc/markdoc';
import React from 'react';

const node = await post.content();
const rendered = Markdoc.renderers.react(node, React);
return <article>{rendered}</article>;
```

**Reading from GitHub at runtime** (when content lives on `main` and the deploy needs fresh data without rebuilding):

```typescript
import { createGitHubReader } from '@keystatic/core/reader/github';
const reader = createGitHubReader(keystaticConfig, {
  repo: 'owner/repo',
  token: process.env.GITHUB_PAT,
});
```

### TypeScript helpers

```typescript
import type { Entry } from '@keystatic/core/reader';
import type keystaticConfig from '../keystatic.config';

type Post = Entry<typeof keystaticConfig['collections']['posts']>;
```

---

## Admin UI route — file layout

### Astro
No manual files. `keystatic()` in `astro.config.mjs` mounts `/keystatic` automatically.

### Next.js App Router
Four files needed (paths assume `app/` at project root — prefix `src/` if applicable):

```
app/keystatic/keystatic.tsx                  ← 'use client'; export default makePage(config)
app/keystatic/layout.tsx                     ← <KeystaticApp />
app/keystatic/[[...params]]/page.tsx         ← () => null
app/api/keystatic/[...params]/route.ts       ← export { POST, GET } = makeRouteHandler({ config })
```

Common errors:
- **`Cannot find module '../../keystatic.config'`** — count the `../` carefully; depth depends on whether you use `src/app/` or `app/`.
- **Admin UI shows but save fails** — route handler is missing or in the wrong place. Verify the file is at `app/api/keystatic/[...params]/route.ts` exactly.
- **`output: 'export'` breaks Keystatic on Next.js** — the route handler can't run on a static export. Drop `output: 'export'` for the deployed site, or treat Keystatic as local-only.

---

## Common patterns

### Blog post collection with cover + SEO
```typescript
posts: collection({
  label: 'Posts',
  slugField: 'title',
  path: 'src/content/posts/*',
  format: { contentField: 'content' },
  entryLayout: 'content',
  columns: ['title', 'publishedDate'],
  schema: {
    title: fields.slug({ name: { label: 'Title' } }),
    publishedDate: fields.date({ label: 'Published', defaultValue: { kind: 'now' } }),
    summary: fields.text({ label: 'Summary', multiline: true, validation: { length: { max: 200 } } }),
    coverImage: fields.image({
      label: 'Cover',
      directory: 'src/assets/images/posts',
      publicPath: '@assets/images/posts/',
    }),
    seo: fields.object({
      title: fields.text({ label: 'SEO title' }),
      description: fields.text({ label: 'SEO description', multiline: true }),
    }),
    content: fields.markdoc({
      label: 'Content',
      options: {
        image: {
          directory: 'src/assets/images/posts',
          publicPath: '@assets/images/posts/',
        },
      },
    }),
  },
}),
```

### Team members
```typescript
team: collection({
  label: 'Team',
  slugField: 'name',
  path: 'src/content/team/*',
  format: { contentField: 'bio' },
  columns: ['name', 'role'],
  schema: {
    name: fields.slug({ name: { label: 'Name' } }),
    role: fields.text({ label: 'Role' }),
    photo: fields.image({
      label: 'Photo',
      directory: 'src/assets/images/team',
      publicPath: '@assets/images/team/',
    }),
    socials: fields.object({
      linkedin: fields.url({ label: 'LinkedIn' }),
      twitter: fields.url({ label: 'Twitter / X' }),
    }),
    bio: fields.markdoc({ label: 'Bio' }),
  },
}),
```

### Homepage with flexible section blocks
```typescript
home: singleton({
  label: 'Home page',
  path: 'src/content/home/',
  schema: {
    sections: fields.blocks({
      hero: {
        label: 'Hero',
        schema: fields.object({
          heading: fields.text({ label: 'Heading' }),
          subheading: fields.text({ label: 'Subheading', multiline: true }),
          cta: fields.object({
            label: fields.text({ label: 'CTA label' }),
            href: fields.url({ label: 'CTA URL' }),
          }),
        }),
      },
      featureGrid: {
        label: 'Feature grid',
        schema: fields.object({
          heading: fields.text({ label: 'Heading' }),
          features: fields.array(
            fields.object({
              title: fields.text({ label: 'Title' }),
              description: fields.text({ label: 'Description', multiline: true }),
              icon: fields.text({ label: 'Icon name' }),
            }),
            { label: 'Features', itemLabel: (p) => p.fields.title.value },
          ),
        }),
      },
    }, { label: 'Sections' }),
  },
}),
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/keystatic` 404s in Astro | `keystatic()` not in `integrations` array, or config file is in `src/` instead of root | Move `keystatic.config.ts` to project root; verify integrations |
| Astro `<Image>` errors with "expected ImageMetadata, got string" | Reading raw frontmatter instead of via Content Collections | Define the matching `defineCollection` with `image()` in schema |
| Saved entries don't appear on the site (Astro) | Dev server didn't re-scan content | Restart `npm run dev`; check filename matches slug |
| Images render in admin but break on the site (Astro) | `publicPath` doesn't match what Astro can resolve | Use a TS path alias and add it to `tsconfig.json` paths |
| Next.js save returns 500 | API route file missing or wrong path | Verify `app/api/keystatic/[...params]/route.ts` exists exactly |
| GitHub login loops at OAuth callback | App slug env var name wrong (Astro vs Next) | Use `PUBLIC_*` for Astro, `NEXT_PUBLIC_*` for Next.js |
| Editor sees stale content after GitHub merge | Reader cached the previous tree | Restart the dev server / redeploy |

---

## Versions and stability

- `@keystatic/core` is the only required package; it's stable and follows semver.
- `@keystatic/astro` ships an integration helper — pin to the major version that matches your Astro major.
- `@keystatic/next` works with Next.js 13+ App Router.
- Keystatic Cloud is in active development. Multi-player editing is experimental and Pro-only.
- Document fields (`fields.document`) are stable but lock you out of Markdown tooling — prefer `markdoc` or `mdx` unless you really only render through Keystatic's React renderer.
