# Project Brief — INclusive (Career / Recruitment Landing Page)

> Auto-generated in Phase 0 from the Figma design.
> Figma file: `S5gmHfd896rwkeo8DkN0PU` · Frame: `2135:6251` ("Career web", 1440 × 6218)

## Overview

A single-page recruitment / "join our team" landing page for **INclusive**, a fast-growing
real-estate company. The page invites viewers to apply and become brokers. Dark, premium,
"luxury" visual style with gold accents.

- **Language:** Bulgarian (Cyrillic). `<html lang="bg">`.
- **Frame width:** 1440px → `--size-container-ideal: 1440`, `--size-container-max: 1440px`.
- **Content width:** 1248px (most sections) → container padding **96px = 6em** each side.
  (The "Everyday life" section uses 1280px content / 80px padding — handled per-section.)
- **Theme:** Dark. Charcoal backgrounds, light/cream text, gold accents + gold gradient.

## Color Palette (from Figma variables)

| Token name | Hex | Role |
|---|---|---|
| 10 Gray | `#F5F4EC` | Cream — primary text on dark |
| 20 Gray | `#EDEFF1` | Light text / headings highlight |
| 40 Gray | `#D8DBDE` | Muted secondary text |
| 80 Gray | `#393C46` | Dark surface — cards, alt sections, borders |
| 100 Gray | `#21232B` | Darkest — page background |
| 80 Gold | `#DBBD6B` | Primary gold accent (borders, underlines, highlights) |
| 100 Gold | `#C4952D` | Deep gold |
| Gold Gradient | `#DBBD6B → #C4952D` | Gradient (buttons / accents) |

## Typography

Original design fonts are **commercial** and the copy is **Cyrillic**:
- Headings: **Le Havre** (Regular) — geometric/deco display, uppercase
- Body / UI: **Futura PT** (Light, Book) — geometric sans

Both are paid (Adobe Fonts / insigne / ParaType). **Substitute used: `Montserrat`** — a free,
high-quality geometric sans with full Cyrillic coverage, loaded from Google Fonts. Heading vs
body contrast is achieved via weight (heading 400/500 uppercase, body 300/400). Swap the
licensed fonts in later by changing `--font-heading` / `--font-body` in `global.css` and the
`<link>` in `BaseLayout.astro` (e.g. an Adobe Fonts kit).

Weights in use: Light (300), Regular/Book (400), Medium (500).

Sizes observed (more captured per-section in Phase 2):
- Hero heading: 56px, uppercase, line-height 1.2
- Hero subtitle: 20px, Light
- Nav links / button: 18px, Book

## Spacing / Layout

- Section content max-width: 1248px, centered. Container padding 6em desktop (96px).
- Navbar: 96px horizontal padding, 16px vertical, 0.5px gold bottom border.
- Common rhythm: 64px / 40px / 24px / 12px gaps. Section vertical padding ~80px top.
- Decorative gold "25px × 2px" mini-rule used as an eyebrow divider in several sections.

## Border radius / Shadows

- Images use rounded rectangles (radius captured per-section in Phase 2).
- Shadows are minimal/none — flat dark surfaces. Captured per-section if present.

## Component patterns

- **Nav button:** outline style — 1px gold border, transparent fill, cream text ("Кандидатствай сега").
- **Primary button (sections/CTA):** filled gold (captured in Phase 2).
- **Icon feature cards:** gold line icon + heading + description, with a small gold rule divider.
- **Testimonial card:** dark surface, avatar + name + title, quote text.
- **Eyebrow divider:** short gold horizontal rule (~25px) above/below text.

## Sections (top → bottom)

1. Navbar — logo, 5 links, outline CTA button
2. Hero — two-tone heading (cream + gold), subtitle, 5-image gallery with edge fade
3. Target audience — centered header + two content rows (image + text blocks)
4. Expectations — header + button, row of 7 icon feature cards (horizontal)
5. Everyday life — bullet/heading list (left) + person image (right)
6. Testimonials — 3 broker testimonial cards
7. Why choose us — header + description, icon features flanking a central building image
8. Final call to action — closing headline + gold button
9. Footer — logo, links, address, contact, copyright bar

## Interaction notes (from Figma annotations)

- Hero image gallery is annotated "снимките ще се въртят" (the images will rotate) and links to
  hypergen.io/about-us. Built **static** first per pipeline rules (matches the screenshot);
  auto-rotation is an optional enhancement to confirm with the user — not invented unprompted.
