# Photo → label → recipe: experimental local model

The app now accepts a photo of a coffee bag, extracts Russian/English text,
allows corrections, and prepares a recipe using the versioned Welder Catherine
dataset. No API key or cloud image upload is required.

## What the model does

1. **OCR:** pretrained Tesseract LSTM (`tessdata_fast` 4.1.0, `rus+eng`). Pillow
   fixes EXIF orientation/transparency and converts to grayscale. Adaptive
   thresholding, two text-layout modes and modest ±10° deskew attempts handle
   some shading and tilt. The highest OCR-quality result is retained without
   consulting coffee names. Raw recognized text remains editable.
2. **Label extraction:** deterministic Russian/English vocabulary and field
   parsing extract country, processing, variety, region and tasting notes.
   Name matching tolerates transliteration and visually identical Cyrillic/Latin
   letters. This is not a fine-tuned label vision model; there is no labeled
   training set of real bag photographs yet.
3. **Known coffee:** a complete name plus the visible Welder Catherine brand
   returns the saved, structurally checked recipe. Partial/fuzzy matches or a
   missing brand require the user to select the correct coffee and filter roast.
   Lot/harvest still need checking: names can be reused.
4. **Unseen coffee:** a TF-IDF nearest-neighbor model fitted on the 35 checked
   coffees compares country, processing, variety, region and tasting notes. It
   transfers one intact reference recipe, including the original equipment,
   grind setting and pour schedule. The UI explicitly calls this a starting
   recipe for a similar coffee; it does not claim that the roaster tested it on
   the user's new coffee. The reference and source links remain visible.
5. **Abstention:** missing country/base processing, unsupported origins/processes,
   new decafs, espresso/dark roast or low similarity produce no automatic
   recommendation. The two malformed source recipes remain excluded. Poor OCR
   requires text review before preparing a recipe.

Country and processing must agree with a reference; similarity must be at least
0.3. The weights (country 2, processing 2, variety 1.5, region 1, flavor 0.5)
and thresholds are hand-set. TF-IDF statistics are fitted from the dataset;
this is a small instance-based ML baseline, not a newly trained neural network.
Similarity and OCR confidence are not probabilities of a correct recipe.
No arbitrary dose scaling, micron conversion or machine actuation is performed.

## Install and run

Python 3.11+; the catalog lookup and training code use the standard library.
Photo recognition additionally needs Pillow and the `tesseract` executable.

```sh
# macOS (or install tesseract-ocr with your Linux package manager)
brew install tesseract

# From the repository root:
python3 -m venv webapp/.venv
webapp/.venv/bin/python -m pip install -r webapp/requirements.txt
webapp/.venv/bin/python -m ml.setup_ocr
webapp/.venv/bin/python -m ml.train

# Start the app:
cd webapp
.venv/bin/python server.py --port 8002
```

Open http://127.0.0.1:8002 and choose a clear, close-up image of the label.
The browser accepts JPEG/PNG/WebP up to 8 MB, corrects orientation and resizes
to a maximum side of 2400 pixels before submitting JPEG. HEIC is not supported;
export to JPEG first. Photos go only to your local server, are held in a temporary
directory during OCR and deleted afterward. They are not placed in the dataset,
logs, Git or a cloud service. The UI keeps its preview in memory until navigation.

The photo/recipe flow works offline after setup; the separate live catalog search
still requests the roaster's public site. If OCR dependencies are unavailable,
manual label text and the recommendation model still work.

The setup script downloads the English/Russian weights from the official
[Tesseract model repository](https://github.com/tesseract-ocr/tessdata_fast/tree/4.1.0),
verifies pinned SHA-256 values and caches them under `webapp/.cache/tessdata/`.
They are Apache-2.0 licensed upstream and are not committed here. Set
`POURPOUR_TESSDATA` to another directory with both files if needed.
OCR uses the official [Tesseract command-line interface](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html).

## Reproduce training and evaluation

```sh
python3 -m ml.train
python3 -m ml.train --snapshot data/welder_catherine/snapshots/20260916T114435680044Z
```

`artifacts/model.json` stores the dataset hashes, version, fitted IDF values,
feature profiles and source-backed reference recipes. The app loads this file;
it does not retrain per request. `artifacts/evaluation.json` stores the full
leave-one-coffee-out predictions. Every fold refits IDF without the held-out
coffee. Packaging variants are grouped, and names/recipe targets are not inputs.

Current result: **27/35** coffees supported, **8 abstentions**. On supported folds:

| Target | Nearest-reference MAE | Training-median MAE |
| --- | ---: | ---: |
| Water temperature | 0.67 °C | 0.44 °C |
| Total brew duration | 9.63 s | 8.15 s |
| Water-to-coffee ratio | 0.049 | 0.037 |

**The recommendation model does not beat the median baseline.** The existing
recipes are very similar, and 35 coffees from one roaster are too few to establish
that recipe differences can be predicted reliably. This version is useful as a
transparent, source-backed reference selector and photo workflow. It is not a
validated optimization model. These results use clean catalog fields, not OCR;
they do not measure photo accuracy or taste. Shared farms/recipe programs can
also make the evaluation optimistic. No held-out test set was used to tune the
weights or thresholds, and no claims of generalization follow from these numbers.

Next model work needs diverse real label photos with transcriptions, more coffee
lots/roasters, and measured brews with feedback. Freeze an independent photo test
set, evaluate transcription/name retrieval separately from recipe transfer, and
evaluate recommendations by coffee/farm/harvest groups plus real brewing outcomes.

## Endpoints

- `GET /api/model`: model version, snapshot, OCR setup status.
- `POST /api/label`: raw JPEG/PNG body → OCR text and recommendation. No image URL
  fetching; 8 MB/16 MP bounds, one OCR process group at a time, 30-second OCR budget.
- `POST /api/recommend`: JSON `{"text":"Country: Rwanda\nProcessing: washed"}`.
  An optional `selected_coffee_id` confirms a catalog candidate; unknown IDs fail.

Response `kind` is one of `catalog_match`, `confirm_match`, `suggested_reference`,
`source_needs_review`, `insufficient_data`, or (photo only) `review_label`.
`recipe_data` is null when the system abstains. Suggested recipes are never
written back into the roaster dataset. This remains a local development server.

## Verification

```sh
webapp/.venv/bin/python -m unittest discover -s ml/tests -v
python3 -m unittest discover -s dataset/tests -v
cd webapp
.venv/bin/python -m unittest discover -s tests -v
```

The OCR integration test runs when dependencies/weights are installed. Its
`tests/fixtures/rwanda-label.png` is a synthetic, clean text label (not a real
photo or an OCR accuracy benchmark). The manual integration check also read
the roaster's angled [Rwanda Susa product image](https://theweldercatherine.ru/upload/iblock/7f5/zvhz0s6hi01i0favlrkzl0hzlg6s8qyf/250g-_1_-_48_.png):
it recovered the coffee name and correctly requested brand confirmation.

`tests/browser-smoke.cjs` is an optional Playwright test. With Playwright and a
browser installed, run it against the local server using
`node ml/tests/browser-smoke.cjs`. Set `POURPOUR_TEST_URL` to change the server,
or `POURPOUR_BROWSER_CHANNEL=chrome` to use installed Chrome. It checks photo →
recipe, unknown-coffee suggestions, abstention, manual confirmation, timer,
invalid upload, same-origin enforcement and mobile overflow.
