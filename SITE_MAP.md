# SITE MAP — INclusive Career Landing Page

**fileKey:** `S5gmHfd896rwkeo8DkN0PU`
**Root frame:** `2135:6251` — "Career web" (1440 × 6218)
**Language:** Bulgarian (Cyrillic) · `lang="bg"`

All sections are part of a single page (`src/pages/index.astro`). Each component is built from
live Figma data via `get_design_context` + `get_screenshot` using the fileKey and the nodeId below.

| # | Section | Component | nodeId | Images / assets |
|---|---------|-----------|--------|-----------------|
| 1 | Navbar | `Navbar.astro` | `2135:6252` | Logo (SVG, inline), 5 links, outline CTA button |
| 2 | Hero | `Hero.astro` | `2135:6288` | 5 gallery photos (hero-1…5.jpg), left design vector (SVG), right edge fade |
| 3 | Target audience | `TargetAudience.astro` | `2135:6310` | 2 content images, gold eyebrow rules |
| 4 | Expectations | `Expectations.astro` | `2138:7205` | 7 icon feature cards (line icons), CTA button |
| 5 | Everyday life | `EverydayLife.astro` | `2135:6397` | 1 person image, bullet/heading list |
| 6 | Testimonials | `Testimonials.astro` | `2135:6420` | 3 cards, 3 avatar images |
| 7 | Why choose us | `WhyChooseUs.astro` | `2135:6463` | 4 icon features + central building image |
| 8 | Final CTA | `FinalCta.astro` | `2135:6561` | Headline + gold button (+ possible bg element) |
| 9 | Footer | `Footer.astro` | `2135:6615` | Logo, links, address + phone icons, copyright bar |

## Decorative background elements (non-content)

- `2135:6308` — "Background design element" (gold/dark vector band below hero)
- `2138:10399` — "Background design element" (vector band near testimonials)

These are decorative vectors; reproduce with CSS or inline SVG as needed, constrained to the
container per the layout model. Not tracked as content images.

## Build order (atoms → organisms → page)

1. Shared atoms: `.btn` / `.btn--outline` (in global.css), `EyebrowRule` (gold mini-rule), icons
2. Organisms: Navbar → Hero → TargetAudience → Expectations → EverydayLife → Testimonials →
   WhyChooseUs → FinalCta → Footer
3. Page: compose in `index.astro` inside `<main>`

## Notes

- Hero gallery is annotated "снимките ще се въртят" (images rotate). Built static first.
- Content width 1248px → `--container-padding: 6em`. "Everyday life" uses 1280px (80px) — per-section override.
- Images downloaded per-section during Phase 2 from `get_design_context` URLs; logged in `IMAGE_MANIFEST.md`.
