# Deploying the web app to coffee.wadymmmmm.ru

The app runs on the VPS `141.98.86.241` next to the existing static landing page.
Nothing of the landing page is touched: it keeps serving `/`, the app answers on `/app`.

```
phone ──HTTPS──▶ nginx (coffee.wadymmmmm.ru)
                   ├── /            → /var/www/coffee        (landing page, unchanged)
                   └── /app, /api/… → 127.0.0.1:8011         (systemd service firstbrew)
```

## Update the live app

From the repository root on the Mac, after pushing to `origin/webapp`:

```sh
bash deploy/deploy.sh
```

It exports the latest pushed commit (not local edits), rsyncs it to `/opt/firstbrew`
and re-runs the server bootstrap. SSH uses port 2222 because the ISP blocks 22.

## What is installed on the server

| piece | path |
| --- | --- |
| app source | `/opt/firstbrew` (no `data/`, `firmware/`, screenshots) |
| virtualenv | `/opt/firstbrew/.venv` (Pillow, pyserial) |
| OCR | `tesseract-ocr` package + pinned weights in `/opt/firstbrew/webapp/.cache/tessdata` |
| source cache | `/opt/firstbrew/webapp/.cache` (catalog, product ids, recipes) |
| service | `/etc/systemd/system/firstbrew.service`, user `firstbrew`, `127.0.0.1:8011`, `--machine none` |
| nginx locations | `/etc/nginx/snippets/firstbrew.conf` + `firstbrew-proxy.conf` |
| rate limits | `/etc/nginx/conf.d/firstbrew-limits.conf` |
| manifest for `/app` | `/var/www/firstbrew/manifest.webmanifest` (same file, `start_url` `/app`) |
| TLS | Let's Encrypt for `coffee.wadymmmmm.ru`, renewed by the certbot timer |

The Python server never listens on a public interface. nginx terminates TLS, limits the
request rate (12 photo uploads a minute, 2 requests a second for the rest per address),
caps the upload at 9 MB and keeps Server-Sent Events unbuffered.

## Everyday commands (on the server)

```sh
systemctl status firstbrew
systemctl restart firstbrew
journalctl -u firstbrew -n 50 --no-pager
```

## Notes

- `--machine none`: the machine button stays hidden on the public site. The machine is
  connected to a local computer, not to the VPS; see [the protocol](../docs/PROTOCOL.md).
- The app fetches the roaster's live catalog, so the server needs outbound internet.
- To move the app to the site root later, point the landing page elsewhere and change
  the two `location = /app` blocks to `location = /`.
