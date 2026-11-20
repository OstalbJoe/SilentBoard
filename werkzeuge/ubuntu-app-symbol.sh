#!/usr/bin/env bash
# SilentBoard – Copyright (C) 2026 ostalbweb.de
# SPDX-License-Identifier: GPL-3.0-or-later
# SilentBoard – App-Symbol für Ubuntu anlegen
#
# Hintergrund: Chromium aus dem Snap-Store darf unter Ubuntu keine Startmenü-Einträge
# anlegen ("failed to execvp: xdg-desktop-menu"). Die installierte Web-App funktioniert,
# taucht aber nicht in der App-Übersicht auf. Dieses Skript legt den Eintrag von Hand an.
#
# Benutzung:  1. SilentBoard in Chromium installieren („App installieren“)
#             2. bash werkzeuge/ubuntu-app-symbol.sh
# Entfernen:  bash werkzeuge/ubuntu-app-symbol.sh --entfernen
set -euo pipefail

APPS="$HOME/.local/share/applications"
ICONS="$HOME/.local/share/icons/hicolor/256x256/apps"

if [[ "${1:-}" == "--entfernen" ]]; then
  grep -l "^X-SilentBoard=true" "$APPS"/*.desktop 2>/dev/null | xargs -r rm -f || true
  rm -f "$ICONS/silentboard.png"
  update-desktop-database "$APPS" 2>/dev/null || true
  echo "SilentBoard-Symbol entfernt."
  exit 0
fi

# 1) Wo speichert Chromium installierte Web-Apps?
RES="$HOME/snap/chromium/common/chromium/Default/Web Applications/Manifest Resources"
if [[ ! -d "$RES" ]]; then
  echo "Keine installierten Chromium-Web-Apps gefunden. Erst SilentBoard in Chromium installieren." >&2
  exit 1
fi

# 2) App-ID ermitteln: die zuletzt installierte Web-App (jüngster Ordner)
APP_ID=$(ls -t "$RES" | head -n 1)
echo "Gefundene App-ID: $APP_ID (zuletzt installierte Chromium-Web-App)"
ANZAHL=$(ls "$RES" | wc -l)
if (( ANZAHL > 1 )); then
  echo "Hinweis: Es sind $ANZAHL Web-Apps installiert – genommen wird die zuletzt installierte."
  echo "Falls das nicht SilentBoard ist: SilentBoard neu installieren und Skript nochmal starten."
fi

# 3) Symbol kopieren (Chromium hat es beim Installieren aus dem Manifest gespeichert)
mkdir -p "$APPS" "$ICONS"
cp "$RES/$APP_ID/Icons/256.png" "$ICONS/silentboard.png"

# 4) Startmenü-Eintrag schreiben
#    Damit das Dock das offene Fenster dem Eintrag zuordnet (sonst Zahnrad-Symbol), muss
#    der Fensterkennzeichner passen: unter Wayland "chrome-<ID>-Default" (= Dateiname),
#    unter X11 "crx_<ID>".
grep -l "^X-SilentBoard=true" "$APPS"/*.desktop 2>/dev/null | xargs -r rm -f || true   # alte Einträge weg
if [[ "${XDG_SESSION_TYPE:-}" == "x11" ]]; then WMCLASS="crx_$APP_ID"; else WMCLASS="chrome-$APP_ID-Default"; fi
DESKTOP="$APPS/chrome-$APP_ID-Default.desktop"
cat > "$DESKTOP" <<EOT
[Desktop Entry]
Version=1.0
Type=Application
Name=SilentBoard
Comment=Schachpartien im Training vorführen
Exec=/snap/bin/chromium --profile-directory=Default --app-id=$APP_ID
Icon=$ICONS/silentboard.png
Terminal=false
Categories=Game;BoardGame;
StartupWMClass=$WMCLASS
X-SilentBoard=true
EOT

# 5) Ubuntu Bescheid geben
update-desktop-database "$APPS" 2>/dev/null || true
gtk-update-icon-cache "$HOME/.local/share/icons/hicolor" 2>/dev/null || true

echo "Fertig: SilentBoard ist jetzt in der App-Übersicht (Super-Taste → „SilentBoard“)."
echo "Tipp: Rechtsklick auf das Symbol → „An Dash anheften“."
