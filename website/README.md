# First Brew / Prototype 01

A continuous, seven-act product experience for the Pour Pour project. React, TypeScript, Vite, Three.js, React Three Fiber, Drei, and GSAP ScrollTrigger. All copy is English. The machine, materials, inscription textures, and scan demonstration are constructed locally; no paid models, remote photography, or external font requests.

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

## Architecture

- `src/experience/`: isolated WebGL scene, procedural machine, and SVG fallback.
- `src/sections/Overlay.tsx`: semantic story, recipe controls, and prototype status.
- `src/hooks/useStory.ts`: one master scroll timeline; drives a mutable scene state without per-frame React renders.
- `src/data/story.ts`: camera interpolation helpers, nozzle trajectory, and deterministic pour schedule.
- `src/components/`: magnetic button and launch dialog.
- `tests/`: trajectory/volume invariants and browser coverage.

The nozzle and path share a trajectory function. Scroll advances three pours (90 + 110 + 100 ml) with bloom and drawdown pauses. The water stream follows the nozzle; the server fills with delivered volume. The time and flow readouts are illustrative, not a physical simulation or measured prototype results. The scan is a fictional package demonstration, not a camera or recognition service.

Reduced motion uses discrete camera/component states and demand rendering. Mobile retains the model with simpler framing and shorter exploded offsets. DPR is clamped to 1–1.5; materials have no downloaded textures; grounds are instanced; lighting uses a small locally rendered environment. A static SVG object and all page controls remain if WebGL fails. Audio is not used.

## Launch subscriptions

By default, the launch dialog clearly states that sign-ups are not open and collects no data. To enable the form, set `VITE_LAUNCH_ENDPOINT` in `.env.local` and rebuild. The endpoint must accept `POST` JSON `{ "email": "..." }`, allow the site's origin, and return a successful status only after saving the subscription. It must implement validation, rate limiting, consent storage, and unsubscribe handling. Never put service secrets in `VITE_` variables; those are public browser configuration.

## Product status

The geometry is an illustrative concept, not production CAD. Architecture is defined, components are selected, and automated brewing tests are next. No launched product, customers, testimonials, or measured performance claims are implied.
