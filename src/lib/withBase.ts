// Prefix a root-relative path with Astro's configured `base` (e.g. "/careers").
//
// Astro auto-prefixes generated routes and bundled assets, but NOT references to
// files in `public/` (images, favicon) or hand-written internal links — those
// stay literal and 404 under a base path. Wrap every such path in withBase().
//
// Works in both .astro frontmatter and client <script> blocks: Vite inlines
// `import.meta.env.BASE_URL` ("/careers/" in this deploy, "/" without a base).
const BASE = import.meta.env.BASE_URL;

export function withBase(path: string): string {
  return BASE.replace(/\/$/, "") + "/" + String(path).replace(/^\//, "");
}

// Site home, base-aware and WITHOUT a trailing slash ("/careers", not "/careers/").
// Logo/home links use this so they never hit the trailing-slash 404 edge.
export const homeHref = BASE.replace(/\/$/, "") || "/";
