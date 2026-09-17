#!/usr/bin/env bash
# Minimal live-nginx patch for the Vite dashboard (VPS level).
# The web-dash container serves everything; the host only needs its
# static-cache block renamed from /_next/ (Next.js) to /assets/ (Vite).
#
# Run on the VPS any time AFTER pushing:
#   bash ~/apps/quickbihar/vps-nginx/patch-dashboard-static.sh
#
# Safe: backs the live file up and reloads nginx ONLY if `nginx -t`
# passes. Rollback: copy the printed .bak file back and reload.
set -u

CONF=/etc/nginx/sites-available/quickbihar.conf
[ -f "$CONF" ] || { echo "NOT FOUND: $CONF"; exit 1; }

if ! grep -q "location ^~ /_next/" "$CONF"; then
  if grep -q "location ^~ /assets/" "$CONF"; then
    echo "already patched — nothing to do"
  else
    echo "ABORT: neither /_next/ nor /assets/ block found — live file differs, not touching it"
    exit 1
  fi
  exit 0
fi

BAK="$CONF.bak.$(date +%F-%H%M)"
cp "$CONF" "$BAK"
echo "backup: $BAK"

sed -i 's|location ^~ /_next/|location ^~ /assets/|' "$CONF"
sed -i 's|# Next.js Static Cache|# Vite Static Cache (hashed build assets, immutable)|; s|# Next.js Application (Admin, Seller, Delivery Partner Portals)|# Partner Dashboard SPA (Admin, Seller, Delivery Portals)|' "$CONF"

sudo nginx -t && sudo systemctl reload nginx && echo "RELOADED"
