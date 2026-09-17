# Welder Catherine archive collection

Entry point: https://theweldercatherine.ru/catalog/arkhiv_kofe/

Collected **2026-09-17**: [snapshot report](../data/welder_catherine/snapshots/20260917T063056514246Z/processed/report.md).
87 listing pages, 692 products, 165 coffee records, 122 pourover recipes.
107 new structurally usable filter-recipe candidates; 13 malformed recipes and
2 recipes with unconfirmed filter roast remain outside the training view.
The 107 candidates contain 98 distinct brewing programs, 95 absent from the
baseline's program fingerprints. No baseline source product IDs overlap.

This collector inventories all publicly linked archive pages, discovers product
cards, and checks recipes on individual coffee pages. Pagination is discovered
from the site rather than a hard-coded total. An empty/broken listing is recorded
as an error, not silently treated as the end of the archive.

```sh
python3 -m dataset.archive collect

# Resume this same observation after interruption; captured responses are reused.
python3 -m dataset.archive collect --resume data/welder_catherine/snapshots/SNAPSHOT_ID

# Rebuild JSONL, the quality report and SQLite entirely offline.
python3 -m dataset.archive build data/welder_catherine/snapshots/SNAPSHOT_ID

python3 -m unittest discover -s dataset/tests -v
```

`collect --baseline PATH` compares against a previous current-catalog snapshot.
By default this is `20260916T114435680044Z`. The baseline's coffee/recipe JSONL
files are copied into hashed, compressed raw sources, making comparisons
self-contained and reproducible without the original baseline directory.

Each snapshot contains:

- `manifest.json`: discovery coverage, product outcomes, source URLs/timestamps/hashes, failures.
- `raw/*.gz`: captured archive listings, product HTML, recipe JSON and baseline records.
- `processed/inventory.jsonl`: every discovered product, including explicit exclusions.
- `processed/coffees.jsonl`: inspected coffee records, including absent recipes and uncertain roast intent.
- `processed/recipes.jsonl`: DRIPPER recipes, retaining incomplete/malformed source data with quality flags.
- `processed/report.json` and `report.md`: coverage, usable examples, baseline overlap, program duplicates and source problems.
- `processed/dataset.sqlite`: disposable query layer; excluded from Git.

## Inclusion and identity

Explicit non-bean formats (drips, capsules, drinks, merchandise, green beans) are
excluded by title; the title and exclusion status remain in the inventory.
Unknown titles are inspected. A coffee page must have coffee-specific properties
or a roast profile; a generic product composition field is insufficient.

Product IDs come from the recipe widget or the product's own structured metadata.
The page's explicit filter SKU names provide filter-roast evidence when the
roast-profile table is absent. The SKU payload is parsed as JSON, never executed.
The evidence basis and filter offer IDs are retained in each coffee record.
The recipe API returns `OK` with `value: null` for some archived products: this
is an observed absence of recipes, distinct from a network or schema failure.
Only `DRIPPER` recipes are normalized. Positive evidence from a filter-roast profile
or explicit filter SKU is required for the training-candidate view. Recipes without that evidence stay
in the audit data with `roast_unconfirmed` and cannot enter that view.

The same source product ID reuses the baseline coffee ID even when a product URL
moved into the archive. New records use `twc:product:<source_product_id>`.
Multiple URLs for the same ID are reported as aliases. Identical recipe content
within a coffee is deduplicated; repeated programs across different coffees are
counted separately from independent programs. Same-name/different-ID overlaps
are reported for manual lot/harvest review, not automatically merged.

All recipe validation and source preservation reuse `dataset.pipeline`.
Unknown values stay null. Temperature, water totals, durations and schedules
are not repaired. A valid structural check does not establish the best tasting
recipe. Equipment settings remain specific to the source grinder and brewer.

## Collection and training limits

Requests are sequential, at least 400 ms apart, and use the existing HTTPS host
allowlist, timeout, response limit and redirect rejection. Transient failures
are retried up to three times. Resuming uses already captured pages; start a new
snapshot for a fresh observation. A live archive can change during collection,
so page counts are discovery coverage, not a guarantee about every historical lot.

Archived descriptions can be edited or reused for another harvest. These records
represent the source at capture time, not its original historical state. Baseline
overlap is based on source identity; review harvests, same-name candidates and
repeated programs before building a combined training release.

Collecting this archive does not replace the model artifact. A subsequent model
experiment should compare against the existing median/reference baselines, group
related lots across train/test, and separately evaluate country-only labels.
Onyx and April are prospective additional sources, not included in this collector.
