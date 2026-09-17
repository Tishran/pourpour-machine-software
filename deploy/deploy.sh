#!/usr/bin/env bash
# Deploy the First Brew web app to the VPS. Run from the repository root on a Mac:
#   bash deploy/deploy.sh
# Sends the latest pushed state of the branch (not your local edits), then runs the
# server bootstrap. Needs an SSH key on the server; port 2222 because the ISP blocks 22.
set -euo pipefail

HOST="${FIRSTBREW_HOST:-root@141.98.86.241}"
PORT="${FIRSTBREW_SSH_PORT:-2222}"
REF="${FIRSTBREW_REF:-origin/webapp}"
TARGET=/opt/firstbrew

cd "$(dirname "$0")/.."
git fetch --quiet origin webapp
echo "==> deploying $REF ($(git rev-parse --short "$REF"))"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git archive "$REF" | tar -x -C "$work"

# mktemp gives a private (0700) directory; rsync -a would copy that mode onto
# /opt/firstbrew and the service user could no longer enter it.
chmod 755 "$work"
chmod -R a+rX "$work"

rsync -az --delete \
  --exclude 'data/' --exclude 'docs/screens/' --exclude 'firmware/' --exclude '.github/' \
  --exclude '.venv/' --exclude 'webapp/.cache/' --exclude '**/__pycache__/' \
  -e "ssh -p $PORT" "$work/" "$HOST:$TARGET/"

ssh -p "$PORT" "$HOST" "bash $TARGET/deploy/setup-server.sh"
echo "==> https://coffee.wadymmmmm.ru/app"
