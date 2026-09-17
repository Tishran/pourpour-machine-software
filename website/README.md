# First Brew / Prototype 01

A continuous, five-act product experience for the First Brew project. React, TypeScript, Vite, Three.js, React Three Fiber, Drei, and GSAP ScrollTrigger. All copy is English. The machine geometry, inscriptions, and scan demonstration are constructed locally. CC0 material maps from ambientCG are optimized and hosted with the site; no paid models, remote photography, or external font requests.

## Run

Requires Node 22.12+ (or 20.19+) and npm.

Run these commands from the `website/` directory (`cd website` from the repository root).

```sh
npm ci
npm run dev
```

Open the localhost URL shown by Vite. This is a Vite app; opening `index.html` directly is not supported.

```sh
npm run build
npm run preview
npm test
npx playwright install chromium
npm run test:browser
```

Deploy the generated `dist/` directory to a static host. If your environment proxies localhost, set `NO_PROXY=127.0.0.1,localhost` when running browser tests.

## Netlify deployment

The repository-root `netlify.toml` configures the Git-connected build:

- Base directory: `website`
- Build command: `npm run build`
- Publish directory: `dist` (relative to the base; `website/dist` in this repository)
- Node.js: 22

Import this repository in Netlify and select the branch containing these changes. The configuration builds only the landing page, not the OCR benchmark or data collection tools. No Netlify plugin or server is needed for this static Vite site. See [Netlify's Vite setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

For a manual deployment, run `npm run build` inside `website/`, then upload **the generated `website/dist` folder** to Netlify Drop. Do not upload the repository or the source `website` folder. The build includes the interactive 3D experience, fonts, textures, and `_headers` configuration. Manual uploads do not run a build.

Launch subscriptions remain disabled unless a real subscription backend is configured. For Git builds, add the public `VITE_LAUNCH_ENDPOINT` in Netlify's build environment and rebuild; for manual uploads, configure it locally before building. Never add API keys to `VITE_` variables.

## Architecture

- `src/experience/`: isolated WebGL scene, procedural machine, and SVG fallback.
- `src/sections/Overlay.tsx`: semantic story, recipe controls, and prototype status.
- `src/hooks/useStory.ts`: one master scroll timeline; drives a mutable scene state without per-frame React renders.
- `src/data/story.ts`: camera interpolation helpers, nozzle trajectory, and deterministic pour schedule.
- `src/components/`: magnetic button and launch dialog.
- `tests/`: trajectory/volume invariants and browser coverage.

The nozzle and path share a trajectory function. Scroll advances three pours (90 + 110 + 100 ml) with bloom and drawdown pauses. The water stream follows the nozzle; the server fills with delivered volume. The time and flow readouts are illustrative, not a physical simulation or measured prototype results. The scan is a fictional package demonstration, not a camera or recognition service.

The pour uses a fixed recipe with no editable parameters or Brew navigation buttons. Scrolling determines delivered volume and progression. Scan brackets and the scanning line remain WebGL geometry attached to the bag, avoiding a separate CSS-transformed HTML layer.

To test the built deployment rather than the development server, run `npm run build` followed by `TEST_PRODUCTION=1 npm run test:browser`. Production browser tests serve `dist/` on port 4175.

Reduced motion uses discrete camera/component states and demand rendering. Mobile retains the model with simpler framing. DPR never exceeds 1.5 and defaults to 1 on mobile. Six 512-pixel texture maps total about 240 KB; grounds are instanced; lighting uses a small locally rendered studio environment. Physical finishes distinguish paint, metals, polymers, paper and glazed ceramic. High/medium use transmission for the two main vessels; low uses reflective transparency. Slow desktop frame rates reduce quality automatically. A static SVG object and all page controls remain if WebGL fails. Audio is not used. See [rendering notes and performance methodology](RENDERING.md) for presets, quality tiers, optical compromises and benchmarks.

The V60 and carafe have hollow profiles with real wall thickness and curved handles that attach at defined mounts. A separate paper-filter mesh has a shaped upper edge, folded seam, and fiber texture, with the grounds contained inside it. The component-study section keeps the machine assembled: the base, carafe, V60, reservoir, arm, and nozzle stay in their mounted positions. The nozzle returns smoothly to center after pouring, without lifting through the housing. See [texture sources and licenses](public/textures/SOURCES.md).

## Launch subscriptions

By default, the launch dialog clearly states that sign-ups are not open and collects no data. To enable the form, set `VITE_LAUNCH_ENDPOINT` in `.env.local` and rebuild. The endpoint must accept `POST` JSON `{ "email": "..." }`, allow the site's origin, and return a successful status only after saving the subscription. It must implement validation, rate limiting, consent storage, and unsubscribe handling. Never put service secrets in `VITE_` variables; those are public browser configuration.

## Preorder interest

The final preorder section uses a native Netlify Forms submission named `preorder-first-brew`, separate from launch subscriptions and the former team form. It collects name, email, optional notes, and consent to preorder emails. It registers interest only: it does not take payment, place an order, reserve stock, or promise a delivery date. A static blueprint in `index.html` mirrors the React form, with a honeypot for spam filtering. Local development deliberately prevents delivery and shows an honest preview notice.

Before accepting real preorder interest, enable **Forms → Enable form detection** in the site's Netlify dashboard, then deploy the updated site. Submissions appear under Forms; configure notifications there if needed. The native POST uses Netlify's receipt page rather than displaying a simulated success message. See [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/). This integration has not been activated or tested against a live Netlify account.

## Product status

The geometry is an illustrative concept, not production CAD. Architecture is defined, components are selected, and automated brewing tests are next. No launched product, customers, testimonials, or measured performance claims are implied.
