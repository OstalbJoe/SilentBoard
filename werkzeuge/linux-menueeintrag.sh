#!/usr/bin/env bash
# SilentBoard – Copyright (C) 2026 ostalbweb.de
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Legt unter Linux einen Eintrag für SilentBoard in der App-Übersicht an (mit Logo).
#
# Benutzung:  bash linux-menueeintrag.sh /pfad/zu/SilentBoard-linux
# Entfernen:  bash linux-menueeintrag.sh --entfernen
set -euo pipefail

APPS="$HOME/.local/share/applications"
ICONS="$HOME/.local/share/icons/hicolor/512x512/apps"
DESKTOP="$APPS/silentboard.desktop"

if [[ "${1:-}" == "--entfernen" ]]; then
  rm -f "$DESKTOP" "$ICONS/silentboard.png"
  update-desktop-database "$APPS" 2>/dev/null || true
  echo "SilentBoard-Eintrag entfernt."
  exit 0
fi

PROG="$(realpath "${1:-}" 2>/dev/null || true)"
if [[ -z "$PROG" || ! -f "$PROG" ]]; then
  echo "Bitte den Pfad zur Programmdatei angeben, z. B.:  bash $0 ~/Downloads/SilentBoard-linux" >&2
  exit 1
fi
chmod +x "$PROG"

# Logo aus dem Repository (liegt neben diesem Skript in ../logo)
HIER="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$APPS" "$ICONS"
cp "$HIER/../logo/icon-512.png" "$ICONS/silentboard.png"

# Terminal=true: das Fenster mit „SilentBoard läuft …“ bleibt sichtbar; Schließen beendet SilentBoard
cat > "$DESKTOP" <<EOT
[Desktop Entry]
Version=1.0
Type=Application
Name=SilentBoard
Comment=Schachpartien im Training vorführen
Exec="$PROG"
Icon=$ICONS/silentboard.png
Terminal=true
Categories=Game;BoardGame;
EOT
update-desktop-database "$APPS" 2>/dev/null || true
echo "Fertig: SilentBoard ist jetzt in der App-Übersicht (Super-Taste → „SilentBoard“)."
