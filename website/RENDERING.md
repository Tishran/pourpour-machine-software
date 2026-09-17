# Rendering and material notes

The procedural First Brew machine keeps its layout, camera path, scroll stages,
scan typography, pour trajectory, interactions and transparent canvas. The
classic URL remains `/?view=classic`; this branch currently renders the same
experience with or without that query.

## Physical finishes

| Preset        | Interpretation                                                               | Approximate scalar roughness |
| ------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| powderCoat    | Warm dielectric paint over metal; microscopic grain and a weak clear coating | 0.38                         |
| brushedSteel  | Stainless sheet/rails; directional highlights, axial brushing on rails       | 0.31                         |
| machinedSteel | Turned steel fittings; finer circumferential machining                       | 0.24                         |
| polishedSteel | Small polished nozzle outlet                                                 | 0.16                         |
| copper        | Warm metallic copper with subtle machining; not orange paint                 | 0.29                         |
| abs           | Molded dark-gray polymer with small specular highlights                      | 0.46                         |
| rubber        | Matte feet, base/scale pad and flexible tubing                               | 0.88                         |
| ceramic       | Glazed V60, distinct from the painted housing                                | 0.23                         |
| glass         | Thin borosilicate, IOR 1.47                                                  | 0.035                        |
| acrylic       | Thin reservoir wall, IOR 1.49                                                | 0.065                        |
| water         | IOR 1.333, non-emissive highlights                                           | 0.045                        |
| kraftPaper    | Tinted paper fibers and subtle roughness variation on the bag                | 0.91                         |
| filterPaper   | Pale paper fibers on the filter/label                                        | 0.96                         |

Roughness maps modulate each scalar within a narrow range. Normal/roughness maps
use NoColorSpace; paper albedo uses SRGBColorSpace. UV transforms are cloned,
cached per surface/scale/direction, and disposed. Rounded-box triangles use
model-space UV extents; cylinders use circumference/height extents. The original
six 512 px CC0 maps still total about 235 KiB. No external texture or HDRI was
added; provenance and runtime derivatives are in [SOURCES.md](public/textures/SOURCES.md).

The reservoir alone gained a thin closed wall/rounded lip, without changing its
outer dimensions. Coffee grains use deterministic shape/color variation and
darken slightly as brewed volume increases. Water no longer emits light.

## Lighting and compositing

A one-shot local studio environment uses broad neutral/warm softboxes and a
narrow front reflection card. It affects reflections, not the visible webpage.
AgX exposure is 1.2. Shadows retain the 1024 px desktop budget; the soft contact
shadow sits immediately below the feet and is captured once.

Only the main reservoir and carafe use physical screen-space transmission on
high/medium. Small glass attachments and water deliberately use cheaper
environment reflections with a view-dependent grazing-opacity response.
This avoids nested transmissive liquid/glass passes. It does not simulate
caustics, multiple internal refractions or actual liquid flow.

Three r183 clears its native transmission buffer to half-alpha white on an
alpha canvas. The optical shader removes that clear-color contribution while
retaining opaque scene content, then preserves grazing reflection coverage.
A regression test checks the installed shader hook; revisit this adapter when
upgrading Three. The canvas stays transparent, and DOM content is composited
behind it, not captured or refracted. This follows the distinction between
[physical transmission and opacity](https://threejs.org/docs/pages/MeshPhysicalMaterial.html).

## Quality and performance

| Mode         | DPR cap | Transmission                                         | Shadow / reflection map |
| ------------ | ------- | ---------------------------------------------------- | ----------------------- |
| High         | 1.5     | Two main vessels, shared native buffer at 0.75 scale | 1024 / 256              |
| Medium       | 1.25    | Same vessels, buffer at 0.5 scale                    | 1024 / 256              |
| Low / mobile | 1       | None; reflective Fresnel-like approximation          | 512 / 128               |

All tiers retain normal, roughness and paper-color maps and anisotropic metals.
No bloom, chromatic effects, fluid simulation or path tracing was introduced.
The higher-resolution contact shadow is a one-shot cost, not a recurring pass.

Desktop starts high, excludes three seconds of warmup, then measures five-second
frame windows. Sustained rates below 48 FPS lower it to medium; below 36 FPS
lower medium to low. It does not oscillate back upward. Mobile-sized canvases
start low. Reduced motion retains demand rendering and bypasses FPS sampling.
Canvas resizes reapply the tier's DPR cap.

Use `?view=classic&quality=high`, `medium` or `low` to hold a tier for diagnosis.
The normal public URL selects automatically. Query overrides are for validation,
not a promise that high is appropriate for every device.

### Reproducing measurements

Start `npm run dev`, then in another terminal:

```sh
npm run benchmark
QUALITY=high DESKTOP_ONLY=1 npm run benchmark
QUALITY=medium DESKTOP_ONLY=1 npm run benchmark
```

The script measures 89 steady-state animation-frame intervals after warmup at
hero, active pour, and inspection, sequentially at desktop 1920×1080 and mobile
390×844 (emulated DPR 2). JSON files in ignored `test-results/` report actual
canvas pixels, selected tier, median/p95 frame intervals, and renderer identity.
Do not run other browser tests concurrently with it.

These are end-to-end frame intervals, not GPU timer queries. Software-rendered
headless results can compare this environment's costs but cannot certify 60 FPS
on M1/Iris Xe or 30 FPS on a midrange phone. Hardware acceptance still requires
those devices; the quality fallback limits rendering features rather than
claiming unmeasured performance.

### Measurements in this environment (September 16, 2026)

Chromium reported **ANGLE / Vulkan SwiftShader**, a software renderer. These
numbers describe this machine's headless test, not integrated-GPU performance.

| Desktop view | Original FPS | High FPS | Medium FPS | Steady low FPS |
| ------------ | -----------: | -------: | ---------: | -------------: |
| Hero         |         8.93 |     5.07 |       5.92 |           9.54 |
| Active pour  |         5.55 |     3.39 |       3.91 |           6.02 |
| Inspection   |         8.98 |     5.23 |       5.96 |           9.69 |

Desktop canvas resolution was 1248×1080 in a 1920×1080 viewport. At device DPR 1,
the high/medium difference mainly measures transmission-buffer resolution.
Low eliminates that pass and uses the smaller shadow/reflection maps. Its
median/p95 frame intervals were 100/116.7 ms (hero), 166.7/166.8 ms (pour), and
100/116.7 ms (inspection). Forced low was measured separately from automatic
startup: the initial high-to-low transition includes shader compilation and
should not be presented as steady-state performance.

| Mobile view | Original FPS | Updated automatic / low FPS |
| ----------- | -----------: | --------------------------: |
| Hero        |        14.75 |                       19.63 |
| Active pour |        12.57 |                       17.62 |
| Inspection  |        15.21 |                       20.70 |

The original mobile renderer used DPR 1.5; the update uses DPR 1 throughout the
story. Actual canvas dimensions change with the existing responsive layout.
Updated medians were 50 ms in all three views; p95 was 66.6, 66.7 and 50.1 ms.
The configured mobile rendering is about 33–40% faster in this test. This does
**not** demonstrate the 30 FPS phone or 60 FPS desktop hardware targets.
