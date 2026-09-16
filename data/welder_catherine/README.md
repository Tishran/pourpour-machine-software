# Welder Catherine pourover dataset

First snapshot: **2026-09-16**, directory `snapshots/20260916T114435680044Z`.
37 filter coffees, 70 packaging offers, 37 pourover recipes, 137 steps. All 37
catalog coffees have a `DRIPPER` recipe. There were no download or parsing errors.
This is the current filter catalog, not a historical archive of every coffee the
roaster has sold. Espresso, AeroPress, batch brew and generic brewing guides are
excluded from normalized recipe records.

## Storage decision

Use versioned **JSONL as the canonical normalized dataset**, compressed source
snapshots for provenance, and **SQLite as a disposable query layer**. These need
only Python's standard library, work locally, and keep the web app independent.
There is no model, generated recipe, or machine-control integration in this change.

Each collection creates a new UTC timestamp directory:

```text
snapshots/<snapshot_id>/
  manifest.json             URLs, retrieval timestamps, hashes, coverage, errors
  raw/<sha256>.gz           source XML, product HTML, recipe JSON
  processed/coffees.jsonl   one record per catalog coffee, packaging grouped
  processed/recipes.jsonl   one record per distinct recipe variant, nested steps
  processed/report.json    missing fields, quality flags, coverage counts
  processed/dataset.sqlite derived database; ignored by Git, rebuilt offline
```

Commit manifests, raw snapshots, JSONL, and reports together. A snapshot is a
dated observation, not a new independent training example. Source hashes cover
the decompressed UTF-8 payload (decoded by the existing web adapter); the pipeline
verifies these hashes on every rebuild. Raw sources are never changed by `build`.
Rebuilding overwrites only `processed/`; record parser and schema versions when
creating a training release. No PostgreSQL or Parquet is needed at this size;
export to Parquet later when training or dataset scale makes it useful.

## Data contract (schema version 1)

| Record | Contents and meaning |
| --- | --- |
| Coffee | Stable `coffee_id` derived from canonical product URL; source product ID; name; availability; packaging offer IDs; `roast_intent=filter`; features; page and catalog provenance |
| Coffee features | Region, variety, processing, harvest, aroma, flavor, aftertaste, body, roaster score, sensory display percentages, filter roast color and original Russian property maps |
| Recipe | Coffee foreign key; content-versioned `recipe_id`; source recipe UUID when present or recovered from steps; device and grinder identities; dose/water in grams, temperature in °C, duration in seconds, water-to-coffee ratio, beverage TDS in percent; raw grinder settings and duration; quality flags |
| Step | Original sequence and step UUID; instruction; incremental and cumulative water grams; start/stop seconds; step temperature; original time strings |
| Source | Public URL, UTC retrieval time, SHA-256, local raw path; recipe JSON pointer identifies its exact element in the saved response |

`recipes.jsonl` retains different variants instead of assuming one recipe per
coffee. Byte-equivalent canonical JSON recipes within a coffee are deduplicated.
Source recipe IDs are not sufficient version identifiers: a recipe can change
while retaining its source ID. The content hash distinguishes these revisions.
`program_fingerprint` detects matching normalized brewing programs across coffees;
the initial snapshot has 35 distinct programs. It includes equipment, grind,
steps and notes, but excludes coffee name and recipe/step UUIDs.

Russian source text is preserved. Country codes are inferred only from a known
country prefix in the product name and explicitly tagged `country_basis`;
`Ява Вайни` remains unknown in this first parser. No geographic or processing
details are guessed from free-form stories. Varieties and processing stay as
source strings for now; future controlled vocabularies must retain these originals.
Unknown values are `null`, not empty strings or invented defaults.

All coffees have region, variety, processing, harvest and flavor. One lacks a
numeric roaster score and filter roast color. `filter_roast_color` has no asserted
measurement scale; source pages do not identify one. Sensory display percentages
are the roaster's UI scores, not laboratory measurements or measured extraction
outcomes. Filter and espresso roast profiles are explicitly kept separate.

## Source-specific rules and quality

- Source `s`, `1ms`, `2ms` mean 0, 60 and 120 seconds, following the existing app's
  source duration convention. `3mnulls` and `2mnulls` remain invalid, not repaired.
- Zero dose, total water, temperature, total duration, TDS and main grinder
  setting are treated as missing sentinels. Zero step water and zero start time
  are valid. Original values remain in the raw API snapshot.
- Grind settings preserve the source's `grind_step.grind_sub_step` display and
  separate original parts. They are not converted to microns, clicks or a numeric
  scale shared by different grinders.
- Beverage TDS is not water mineral content. `water_mineral_ppm` stays unknown.
  No paper filter or water chemistry is inferred from the general brewing guide.
- A missing step temperature stays `null`; no implicit carry-forward occurs.
- `scalar_targets_usable` means positive, parseable dose/water/time/temperature
  with temperature at most 100°C. It does not validate the pour schedule.
- `schedule_usable` requires those fields plus steps with valid ordering, times,
  non-overlap, no step beyond total duration, known water amounts, and a total
  within 0.5 g of the stated water. Missing step temperature is a warning.
- The SQLite `scalar_training_candidates` view requires both flags and a fully
  parsed coffee. It contains **35 candidates**. These checks are structural;
  they do not prove taste quality or establish that a recipe is optimal.

The first snapshot includes three source issues:

| Coffee | Issue | Treatment |
| --- | --- | --- |
| Перу Valle Sagrado из бочки | Total time `3mnulls`; one start time `2mnulls` | Keep raw strings, normalized times null; exclude from candidate view |
| Колумбия Рэйнбоу декаф | Stated 240 g water; steps sum to 250 g | Preserve both; exclude from candidate view |
| Руанда Суса | One step temperature is zero/missing | Keep null and warning; scalar candidate remains available |

The manifest records failed downloads separately from a successful response with
no pourover recipe. Rebuilds retain coffees with missing/failed recipes and report
them rather than silently dropping them. A failed collection returns a nonzero
exit status; start a new collection to retry. The collector does not resume or
fill gaps from a stale cache.

## Run from the repository root

Python 3.11+, no third-party packages:

```sh
# New dated source snapshot; needs network access (~75 sequential requests).
python3 -m dataset.pipeline collect

# Reproduce normalized data and SQLite from the captured sources, offline.
python3 -m dataset.pipeline build data/welder_catherine/snapshots/20260916T114435680044Z

# Dataset regression tests; no network needed.
python3 -m unittest discover -s dataset/tests -v
```

Requests reuse the existing adapter: allowlisted HTTPS hosts, no redirects,
15-second timeout, 8 MB response limit, at least 400 ms between request starts.
Catalog: https://theweldercatherine.ru/bitrix/catalog_export/yandex_848006.php
Product pages supply `#recipe-template[data-id]`; this differs from packaging IDs.
Recipes: `https://recipes.theweldercatherine.ru/api/v1/recipes?product_id=<id>&view=true`.
The catalog feed is explicitly allowed in the site's robots.txt as checked on
the collection date. Public access does not establish an open-data license;
source ownership stays with the roaster and publication/licensing needs a separate decision.

Example query after building:

```sql
SELECT name, processing, coffee_g, water_g, temperature_c, duration_seconds
FROM scalar_training_candidates
ORDER BY name;
```

## Preparing for ML later

37 coffees from one roaster are a seed dataset, not evidence of reliable
generalization. Recipes are **roaster recommendations**, not experimentally
verified optima; product tasting scores are not recipe evaluation scores.

Use coffee characteristics as inputs, brewer/grinder/dose as explicit operating
conditions, and ratio, temperature, timing, pour schedule and grinder-specific
setting as possible targets. Do not blindly treat every database column as an
input: names, IDs, source URLs, notes and target-derived quantities can leak the
label. Flavor descriptions and proprietary roast measurements may be unavailable
for a new coffee, so evaluate a baseline on features users can actually supply.

Split by coffee/lot, keeping all variants, packaging offers and snapshots of a
coffee together. Audit duplicate program fingerprints and near-duplicate lots.
URLs may be reused for new harvests: before longitudinal training, curate lot
identity using source product ID, harvest and human review. Do not count repeated
snapshots as extra independent samples. Avoid random step-level or recipe-variant
splits that place the same coffee in training and evaluation.

Next data work: collect future dated catalogs, expand to verified archived lots,
normalize processing/variety vocabularies, and add actual brew trials as a separate
table keyed to recipe revision with machine, grinder calibration, water chemistry,
roast date, measured output and user feedback. Keep future model suggestions and
brew outcomes separate from these original roaster labels.
