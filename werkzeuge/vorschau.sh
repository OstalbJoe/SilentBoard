#!/usr/bin/env bash
# SilentBoard – Copyright (C) 2026 ostalbweb.de
# SPDX-License-Identifier: GPL-3.0-or-later
# Startet den lokalen Testserver für die Web-App – oder meldet, dass er schon läuft.
PORT=8642
URL="http://localhost:$PORT/silentboard/"
cd "$(dirname "$0")/.." || exit 1
if ss -ltn 2>/dev/null | grep -q ":$PORT\b"; then
  echo "Der Testserver läuft schon (in einem anderen Terminal-Tab)."
  echo "Öffnen:  $URL"
  echo "Beenden: im Tab des Servers Strg+C drücken"
  exit 0
fi
echo "Testserver läuft:  $URL   (Beenden mit Strg+C)"
# --bind 127.0.0.1: nur dieser Rechner, nicht das ganze WLAN
exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory web
