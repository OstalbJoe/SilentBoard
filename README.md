<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/silentboard-logo-dunkel.svg">
    <img src="logo/silentboard-logo.svg" alt="SilentBoard" width="420">
  </picture>
</p>

# SilentBoard

**Schachpartien im Training vorführen, ohne die Lösung zu verraten.**
Der Trainer sieht am Laptop Züge, Kommentare und die Engine – der Fernseher zeigt nur das Brett.
So denkt die Gruppe selbst über den nächsten Zug nach.

- Partien als **Lichess-Link** laden (Partien, Studien, Übertragungen) oder als **PGN** einfügen
- Zweites Fenster für den Fernseher, wird automatisch mitgeführt
- Eingebaute Engine (Stockfish 19), läuft lokal – nur für den Trainer sichtbar
- „TV einfrieren“ zum heimlichen Vorausschauen, Vorschläge der Gruppe als eigene Varianten
- Läuft ohne Installation als einzelne HTML-Datei oder als installierbare Web-App, auch offline

## Benutzen

Die fertige Datei `SilentBoard.html` gibt es unter **Releases** in diesem Repository.
Per Doppelklick im Browser öffnen (Chrome, Edge oder Firefox). Internet wird nur zum Laden von
Lichess-Links gebraucht. Kurzanleitung: im Tool auf **?** klicken.

## Selbst bauen

Voraussetzung: [Node.js](https://nodejs.org) (ab Version 18) und Python 3 für den Testserver.

    npm install        # einmalig
    npm run build      # erzeugt SilentBoard.html und web/silentboard/ (Web-App)
    npm run vorschau   # Testserver: http://localhost:8642/silentboard/

| Pfad | Inhalt |
|---|---|
| `quellcode/app.html` | die App (HTML, CSS, JavaScript) |
| `quellcode/entry.js` | bündelt chessground und chess.js |
| `quellcode/build.mjs` | setzt alles zu einer Datei bzw. zur Web-App zusammen |
| `quellcode/pwa/` | Manifest, Service Worker und `.htaccess` der Web-App |
| `logo/` | Logo (hell und dunkel) und App-Symbole |
| `werkzeuge/` | Testserver, App-Symbol für Ubuntu (Chromium aus dem Snap-Store) |

### Web-App veröffentlichen

Den **kompletten Inhalt** von `web/silentboard/` (inklusive der versteckten Datei `.htaccess`) auf einen
Webserver mit **https** hochladen. Nutzer können SilentBoard dann in Chrome oder Edge über
„App installieren“ als App einrichten. Bei Updates neu bauen und alles erneut hochladen.

## Lizenz

Copyright © 2026 ostalbweb.de

SilentBoard ist freie Software: Du kannst es unter den Bedingungen der **GNU General Public License,
Version 3** oder (nach deiner Wahl) jeder späteren Version weitergeben und/oder verändern – siehe
[`LICENSE`](LICENSE). Wer eine veränderte Fassung weitergibt, muss sie ebenfalls unter der GPL und mit
vollständigem Quellcode weitergeben.

Enthaltene Fremdkomponenten:

| Komponente | Urheber | Lizenz | Quelle |
|---|---|---|---|
| Stockfish 19 | The Stockfish developers | GPL-3.0 | [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish) |
| stockfish.js 19.0.1 (WebAssembly „lite single“) | Nathan Rugg, Chess.com LLC; Netz: Chris Bao (sscg13) | GPL-3.0 | [nmrugg/stockfish.js v19.0.1](https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1) |
| chessground 9.2.1 | lichess.org | GPL-3.0-or-later | [lichess-org/chessground v9.2.1](https://github.com/lichess-org/chessground/tree/v9.2.1) |
| Figurensatz „cburnett“ | Colin M. L. Burnett | GPL-2.0-or-later | über chessground |
| chess.js 1.4.0 | Jeff Hlywa | BSD-2-Clause | [jhlywa/chess.js v1.4.0](https://github.com/jhlywa/chess.js/tree/v1.4.0) |

Die exakten Versionen aller Pakete legt `quellcode/package-lock.json` fest.
SilentBoard ist kein offizielles Produkt von lichess.org und steht in keiner Verbindung dazu.

## Haftungsausschluss – Nutzung auf eigene Gefahr

SilentBoard wird kostenlos und **ohne jede Gewährleistung** bereitgestellt, auch ohne die stillschweigende
Gewährleistung der Marktreife oder der Eignung für einen bestimmten Zweck (GPL Abschnitte 15 und 16).
Die Nutzung erfolgt auf eigene Gefahr. Engine-Bewertungen und Analysen können fehlerhaft sein.
Soweit gesetzlich zulässig, haftet ostalbweb.de nicht für Schäden aus der Nutzung oder Nichtnutzbarkeit;
unberührt bleibt die Haftung für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung
des Lebens, des Körpers oder der Gesundheit.

## Datenschutz

SilentBoard sammelt keine Daten und hat keine Benutzerkonten. Partien und Einstellungen werden nur lokal
im Browser gespeichert. Nur beim Laden eines Lichess-Links verbindet sich SilentBoard mit lichess.org;
dabei erhält Lichess wie bei jedem Seitenaufruf die IP-Adresse.

Sicherheitslücken bitte wie in [`SECURITY.md`](SECURITY.md) beschrieben melden.
