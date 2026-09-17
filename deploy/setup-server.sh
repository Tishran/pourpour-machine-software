#!/usr/bin/env bash
# Idempotent server bootstrap for the First Brew web app. Run as root on the VPS:
#   bash /opt/firstbrew/deploy/setup-server.sh
# It never touches the existing static site; nginx changes live in one snippet file.
set -euo pipefail

APP_DIR=/opt/firstbrew
SERVICE_USER=firstbrew

echo "==> packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq python3-venv tesseract-ocr >/dev/null

echo "==> service user"
id -u "$SERVICE_USER" >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"

echo "==> virtualenv"
[ -x "$APP_DIR/.venv/bin/python" ] || python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install -q --upgrade pip
"$APP_DIR/.venv/bin/pip" install -q -r "$APP_DIR/webapp/requirements.txt"

echo "==> OCR weights (pinned, checksum-verified)"
mkdir -p "$APP_DIR/webapp/.cache"
(cd "$APP_DIR" && "$APP_DIR/.venv/bin/python" -m ml.setup_ocr)

echo "==> permissions"
chown -R root:root "$APP_DIR"
chmod 755 "$APP_DIR"
# Everything but the virtualenv, whose bin/ entries must stay executable.
find "$APP_DIR" -path "$APP_DIR/.venv" -prune -o -type d -exec chmod 755 {} +
find "$APP_DIR" -path "$APP_DIR/.venv" -prune -o -type f -exec chmod 644 {} +
chmod +x "$APP_DIR/deploy"/*.sh
chmod 755 "$APP_DIR/.venv/bin"/*
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/webapp/.cache"

echo "==> systemd"
install -m 644 "$APP_DIR/deploy/firstbrew.service" /etc/systemd/system/firstbrew.service
systemctl daemon-reload
systemctl enable --now firstbrew
systemctl restart firstbrew
sleep 2
systemctl --no-pager --lines=5 status firstbrew || true

echo "==> local check"
curl -fsS --max-time 10 http://127.0.0.1:8011/api/health && echo
echo "Server side ready."
