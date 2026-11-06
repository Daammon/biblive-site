# biblive.app

Static website for Biblive, deployed to GitHub Pages by `.github/workflows/pages.yml` (uploads `docs/`) with the custom domain `biblive.app`.
It uses the app's design system: tokens from `dailybible/apps/mobile/src/core/theme`, Literata and Inter, and the app icon glyph.

## Build

```bash
npm install
npm run build                                   # docs/ (legal pages with owner placeholders become holding pages)
npm run build:preview                           # full legal drafts, for local review only; never commit this output
python src/make_assets.py                       # fonts, icons, screenshots, social images (needs fonttools, brotli, pillow)
```

- Copy: `src/build.mjs` (`T.es`, `T.en`). Launch line, store links and e-mails: `src/site.json`.
  When a store link is set, its "coming soon" badge becomes a real link.
- Legal pages are rendered from the app repo's `../dailybible/legal/{es,en}/*.md` (single source).
  Controller details and the privacy address are in `src/legal.json`.
- No JavaScript. A strict Content-Security-Policy is set in every page; inline `style` attributes are blocked by it, so use classes.

## Pages

| Path | Source |
| --- | --- |
| `/`, `/en/` | home |
| `/privacidad/`, `/en/privacy/` | `legal/*/privacy.md` |
| `/terminos/`, `/en/terms/` | `legal/*/terms.md` |
| `/eliminar-cuenta/`, `/en/delete-account/` | `legal/*/delete-account.md` |
