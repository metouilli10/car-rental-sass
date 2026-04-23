Generated PWA assets for Locaryx.

- `scripts/generate-pwa-icons.mjs` is the source of truth for the padded launcher and maskable icon compositions.
- `icon-launcher-source.png` is the generated launcher-style base used for `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and `public/assets/locaryx-favicon.png`.
- `icon-maskable-source.png` is the generated Android-safe base used for `icon-512-maskable.png`.
- `public/assets/locaryx-favicon.png` mirrors the same uploaded icon for legacy asset references.
- Replace these files with final brand-approved exports if design delivers dedicated PWA assets.
