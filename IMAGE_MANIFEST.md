# IMAGE MANIFEST

Tracks every downloaded asset: filename, section, description, status.
Stored in `public/assets/images/`, referenced as `/assets/images/<filename>`.
Raster photos downscaled (sips, q80–85) for web; icons & logo from Figma exports.

| Filename | Section | Type | Description | Status |
|----------|---------|------|-------------|--------|
| logo.png | Navbar / Footer | PNG @4x | INclusive wordmark + tagline (bg matches dark) | ✅ |
| hero-1.jpg … hero-5.jpg | Hero | JPG 1000×666 | Team/office gallery photos (5 visible) | ✅ |
| target-1.jpg | Target audience | JPG 900px | Team in office (row 1) | ✅ |
| target-2.jpg | Target audience | JPG 900px | Brokers meeting (row 2) | ✅ |
| icon-1.svg … icon-7.svg | Expectations | SVG | Gold line icons (Phosphor-style) | ✅ |
| everyday.jpg | Everyday life | JPG 676×760 | Broker portrait | ✅ |
| avatar-1.jpg … avatar-3.jpg | Testimonials | JPG 200px | Broker avatars | ✅ |
| why-1.svg … why-4.svg | Why choose us | SVG | Gold icons (Handshake, NotePencil, BoundingBox, ChartLineUp) | ✅ |
| why-building.jpg | Why choose us | JPG 680×700 | Central building photo | ✅ |
| cta-bg.jpg | Final CTA | JPG 1556px | Building bg (under 90% dark overlay) | ✅ |

## Notes
- Logo exported as PNG with baked `#21232b` background (Figma includes ancestor bg in
  exports); blends seamlessly on the dark navbar/footer.
- Decorative left vector in Hero and the Rectangle card-backgrounds (Testimonials, Final CTA,
  Footer frame) are reproduced in CSS rather than via polluted SVG exports.
- Minor source typos corrected for production: "екип.z"→"екип." (Expectations card 4),
  email placeholder "Телефон"→"Имейл адрес" (Final CTA), "Защина"→"Защита" (Footer).
