# கடை கணக்கு — Kadai Tracker

A Tamil-first (also English, Hindi and Marathi) sales and expense tracker for a family roadside stall. The live app is a single-file PWA:

**https://rajasudalai81-ai.github.io/**

This GitHub Pages repo serves that built app from the root `index.html`. **Do not edit root `index.html` by hand.**

## Source (for another AI or a developer)

All editable source, docs and tests live in the **`source/`** folder:

https://github.com/rajasudalai81-ai/rajasudalai81-ai.github.io/tree/main/source

Start here for a full project handoff:

https://github.com/rajasudalai81-ai/rajasudalai81-ai.github.io/blob/main/source/HANDOFF.md

The source folder has `logic.js`, `app.js`, `i18n.js`, `index.src.html`, `build.js`, `dev.html`, `README.md`, `HANDOFF.md` and `tests/`. It does not include screenshots, the project zip, or `DEPLOY.json`.

## Build

Clone this repo, then from `source/`:

```bash
node build.js
```

That inlines `i18n.js`, `logic.js` and `app.js` into `index.src.html` and writes `index.html`. To publish, copy the built `index.html` to the repo root (and keep `.nojekyll`).

## Test

From `source/`:

```bash
node tests/run.js
node tests/ui-smoke.js
node tests/ui-smoke.js https://rajasudalai81-ai.github.io/
```

The smoke test needs Chrome and `puppeteer-core`. See `source/HANDOFF.md` for current test counts, version history and known limits.
