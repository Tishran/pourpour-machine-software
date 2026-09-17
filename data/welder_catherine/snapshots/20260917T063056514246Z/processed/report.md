# Welder Catherine archive inventory

Snapshot: `20260917T063056514246Z`. Baseline: `20260916T114435680044Z`.

Source coverage complete: **True**. This is structural validation, not a taste evaluation.

| Measure | Count |
| --- | ---: |
| listing_pages | 87 |
| expected_pages | 87 |
| listed_products | 692 |
| coffees | 165 |
| pourover_recipes | 122 |
| steps | 430 |
| training_candidates | 107 |
| training_coffees | 107 |
| new_training_candidates | 107 |
| new_training_coffees | 107 |
| overlapping_coffees | 0 |
| unchanged_recipes_from_baseline | 0 |
| unique_usable_programs | 98 |
| new_usable_programs | 95 |

## Inventory outcomes

| Measure | Count |
| --- | ---: |
| excluded_format | 525 |
| fetched | 165 |
| not_coffee | 2 |

## Coffee outcomes

| Measure | Count |
| --- | ---: |
| has_pourover | 120 |
| no_pourover | 43 |
| roast_unconfirmed | 2 |

## Recipe quality issues

| Measure | Count |
| --- | ---: |
| invalid_step_time | 1 |
| missing_duration_seconds | 4 |
| missing_grind_setting | 1 |
| missing_step_temperature | 1 |
| step_temperature_above_100c | 1 |
| step_water_sum_mismatch | 8 |

## Missing coffee features

| Measure | Count |
| --- | ---: |
| country_code | 2 |
| filter_roast_color | 40 |
| flavor | 0 |
| harvest | 2 |
| processing | 0 |
| region | 2 |
| variety | 0 |

## Interpretation

- New means a source product ID absent from the baseline; it does not prove an independent farm/harvest.
- A training candidate needs positive filter-roast evidence and a structurally valid DRIPPER recipe.
- Missing recipes, unknown roast intent and malformed schedules are retained for audit, not guessed.
- Program fingerprints detect repeated equipment/settings/pour schedules across coffees.
- Same-name overlaps need lot/harvest review before combining snapshots.
- The source archive mixes beans, drip bags, drinks and merchandise; listed products are not training rows.
- These are current observations of archived pages, not a reconstruction of their original publication dates.
- The app model has not been replaced by this collection. Evaluate grouped lots and sparse labels before promotion.

Details, source links, overlap candidates and individual recipe issues are in `report.json` and the JSONL files.
