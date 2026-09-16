# Recipe app development

This is the working recipe finder imported from the Downloads prototype. It is
separate from `../website`, the React/Three.js product landing page.

## Run

```sh
cd webapp # from the repository root
python3 server.py
```

Open http://127.0.0.1:8000. Python 3.11+ is the only runtime dependency.
The catalog and recipes require internet access; disk caches live in `.cache/`.
Restart Python after backend changes; refresh the browser after static-file changes.

## Architecture and enhancement points

| File | Responsibility |
| --- | --- |
| `server.py` | Local HTTP server, three JSON endpoints, static assets and response headers |
| `pourpour.py` | Roaster catalog/recipe adapters, normalization, search and disk cache |
| `static/index.html` | Russian-language page structure and search form |
| `static/style.css` | Responsive layout, colors, typography and reduced-motion styling |
| `static/app.js` | Search, selection, recipe variants, error states and brewing timer |
| `tests/test_pourpour.py` | Parser, search and cache regression tests |
| `tests/browser/recipe.spec.cjs` | Desktop/mobile Chromium UI checks with intercepted API responses |

Data flows from the roaster's catalog to a product page's recipe ID and then to
the recipe API. Only dripper recipes are retained. The API exposes search,
recipe lookup and local health checks. There is no database, authentication,
AI adaptation, OCR integration or machine control in this app.

The current implementation is small enough to enhance directly without a
framework migration. Keep source recipe values and source timestamps visible
when adding personalization. Useful next work includes saved recipes, dose
adaptation, package recognition and a focused mobile brewing view; these are
proposals, not implemented features.

Known constraints from source review:

- Search returns at most 60 products while `total` counts all matches; there is
  no pagination, so larger result sets cannot all be browsed.
- All source requests share a cache lock; slow upstream requests can delay
  otherwise unrelated lookups. This needs attention before multi-user hosting.
- UI state and timer progress are in memory and reset when the page reloads.
- The Python standard-library server is intended for local development.

## Checks and browser tools

Backend tests and JavaScript syntax checking require no Node packages:

```sh
python3 -B -m unittest discover -s tests -v
node --check static/app.js
```

For the optional browser development toolchain, use Node.js 20+ and npm:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run test:browser:ui
```

Playwright starts its own Python server on 127.0.0.1:8766. Keep that port free.
The browser suite uses checked-in fixtures parsed by the real Python adapter and
intercepts browser API calls, so it does not depend on the live roaster service.
It checks selection, timer controls, empty results, missing recipes, retry,
focus and horizontal overflow at desktop and mobile viewport sizes. It does
not validate live upstream availability or constitute a full accessibility audit.
Failure screenshots and traces are written to the ignored `test-results/` folder.

Browser DevTools and the Playwright UI are sufficient for the current stack.
The optional Product Design plugin was suggested for future UX prototyping;
its installation/connection must be completed before using it. No external
design plugin is required to run, test or edit the app.
