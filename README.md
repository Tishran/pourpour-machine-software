# Pour Pour

This repository contains four separate projects:

- [webapp/](webapp/README.md): the coffee recipe finder and brewing timer (Python + vanilla JavaScript).
- [website/](website/README.md): the First Brew interactive landing page.
- [ocr_benchmark/](ocr_benchmark/README.md): coffee-package OCR benchmarks.
- [package_image_scraping/](package_image_scraping/): coffee-package image data collection.

## Run the website

```sh
cd website
npm ci
npm run dev
```

See [website/README.md](website/README.md) for build, test, and deployment instructions.

## Run the recipe app

```sh
cd webapp
python3 server.py
```

Open http://127.0.0.1:8000. Python 3.11+ is required; no runtime packages are needed.
See [webapp/DEVELOPMENT.md](webapp/DEVELOPMENT.md) for architecture, checks, and browser tooling.
