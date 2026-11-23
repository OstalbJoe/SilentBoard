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

- Partien als **Lichess-Link** laden (Partien, Studien, Übertragungen), als **PGN-Datei** öffnen bzw. ins Fenster ziehen oder als PGN-Text einfügen
- Zweites Fenster für den Fernseher, wird automatisch mitgeführt
- Eingebaute Engine (Stockfish 19), läuft lokal – nur für den Trainer sichtbar
- „TV einfrieren“ zum heimlichen Vorausschauen, Vorschläge der Gruppe als eigene Varianten
- Eigene Analyse: Kommentare schreiben und bearbeiten, Züge bewerten (!, ?, !? …) und alles als **PGN-Datei speichern**
- **Quiz:** Die Spieler raten den nächsten Zug auf dem Handy, die Engine vergibt Punkte, der Fernseher zeigt Auflösung und Tabelle

## Benutzen

Die Programmdatei gibt es unter **Releases** in diesem Repository:

| System | Datei | Start |
|---|---|---|
| Windows | `SilentBoard-windows.exe` | Doppelklick. Beim ersten Start warnt Windows („Unbekannter Herausgeber“): „Weitere Informationen → Trotzdem ausführen“. |
| Linux | `SilentBoard-linux` | Einmal ausführbar machen (Dateieigenschaften → „Als Programm ausführen“), dann starten. |

SilentBoard öffnet sich im Browser. Internet wird nur zum Laden von Lichess-Links gebraucht.
Kurzanleitung: im Programm auf **?** klicken.

**Beenden:** Schließt du den Browser, beendet sich SilentBoard nach 10 Sekunden von selbst. Ist im Quiz ein
Raum offen, fragt der Browser vorher nach und SilentBoard läuft weiter, damit Spieler und Punkte erhalten
bleiben – erneut starten holt alles zurück. „⏻ Beenden“ oben rechts beendet SilentBoard jederzeit sofort.

**Linux – App-Übersicht:** Die Programmdatei zuerst an ihren festen Platz legen (z. B. `~/Programme/`). Beim ersten
Start fragt SilentBoard im Browser, ob es mit Logo in die App-Übersicht aufgenommen werden soll; danach startet man es
über die Super-Taste oder das Dock. Wird die Datei später verschoben, fragt SilentBoard erneut und passt den Eintrag an.
Von Hand geht es auch: `SilentBoard-linux --installieren` bzw. `--entfernen`.

### Quiz

Der Trainer wählt rechts über der Zugliste **Modus: Quiz** und klickt unter den Einstellungen „Raum öffnen“. Erst dann ist SilentBoard im WLAN erreichbar; vorher hört
das Programm nur auf den eigenen Rechner. Die Spieler scannen den QR-Code auf dem Fernseher (Laptop und Handys im
selben WLAN), der Trainer fragt Stellungen ab, die Engine bewertet jeden abgegebenen Zug:

| Zug | Punkte |
|---|---|
| „Guter Zug“ (Verlust an Gewinnchance bis 3 % und bis 0,5 Bauern) | 2 |
| „Etwas ungenau“ (Verlust bis 10 % und bis 1,5 Bauern) | 1 |
| „Leider daneben“ (größerer Verlust), „Weiß nicht“ | 0 |

Ein Zug muss beide Grenzen einhalten: Die Gewinnchance ist in ausgeglichenen Stellungen fair, die Bauern-Grenze sorgt
dafür, dass auch in klar gewonnenen oder verlorenen Stellungen ein Figureneinsteller keine Punkte bekommt. Unter ⚙
lässt sich auch nur nach Gewinnchance oder nur nach Bauern werten; alle Grenzen sind einstellbar. Wer den Partiezug errät, wird markiert, bekommt dafür aber keine Extrapunkte.
Unter Windows fragt die Firewall beim ersten Öffnen eines Raums nach – „Private Netzwerke“ erlauben.

## Selbst bauen

Voraussetzung: [Node.js](https://nodejs.org) ab Version 18.

    npm install        # einmalig
    npm run build      # erzeugt dist/SilentBoard-linux und dist/SilentBoard-windows.exe
    npm start          # zum Entwickeln: startet SilentBoard direkt aus dem Quellcode

| Pfad | Inhalt |
|---|---|
| `quellcode/app.html` | Trainer-Ansicht und Fernseher (HTML, CSS, JavaScript) |
| `quellcode/spieler.html` | Seite für die Handys der Spieler |
| `quellcode/programm.mjs` | das Programm: lokaler Server, Raum für die Handys |
| `quellcode/entry.js` | bündelt chessground, chess.js und den QR-Code-Erzeuger |
| `quellcode/build.mjs` | baut die Seiten und die Programmdateien |
| `logo/` | Logo (hell und dunkel) und App-Symbole (`npm run symbole`) – nicht unter der GPL, siehe `logo/LIZENZ.md` |
| `werkzeuge/` | App-Symbole erzeugen |

## Lizenz

Copyright © 2026 ostalbweb.de

SilentBoard ist freie Software: Du kannst es unter den Bedingungen der **GNU General Public License,
Version 3** oder (nach deiner Wahl) jeder späteren Version weitergeben und/oder verändern – siehe
[`LICENSE`](LICENSE). Wer eine veränderte Fassung weitergibt, muss sie ebenfalls unter der GPL und mit
vollständigem Quellcode weitergeben.

### Zusätzliche Bedingungen nach GPL Abschnitt 7

Für den Quellcode von SilentBoard gelten zusätzlich zur GPL diese Bedingungen:

1. **Name und Logo** (GPL Abschnitt 7 e): Der Name „SilentBoard“ und das SilentBoard-Logo sind nicht Teil
   der GPL-Lizenz; alle Rechte daran liegen bei ostalbweb.de (siehe [`logo/LIZENZ.md`](logo/LIZENZ.md)).
   Unveränderte Kopien der offiziellen Fassung dürfen mit Name und Logo weitergegeben werden. Eine
   veränderte Fassung muss unter einem anderen Namen und mit einem anderen Logo weitergegeben werden;
   der Hinweis, dass sie auf SilentBoard beruht, ist erlaubt.
2. **Urheberhinweis** (GPL Abschnitt 7 b): Veränderte Fassungen müssen in ihren rechtlichen Hinweisen
   (bei SilentBoard: Dialog „Lizenz & Info“) den Hinweis **„Ursprünglich entwickelt von ostalbweb.de
   (SilentBoard)“** gut lesbar beibehalten.

Diese Bedingungen gelten ab Version 2.0. Bereits veröffentlichte Versionen bleiben unter ihren bisherigen
Bedingungen.

Enthaltene Fremdkomponenten:

| Komponente | Urheber | Lizenz | Quelle |
|---|---|---|---|
| Stockfish 19 | The Stockfish developers | GPL-3.0 | [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish) |
| stockfish.js 19.0.1 (WebAssembly „lite single“) | Nathan Rugg, Chess.com LLC; Netz: Chris Bao (sscg13) | GPL-3.0 | [nmrugg/stockfish.js v19.0.1](https://github.com/nmrugg/stockfish.js/releases/tag/v19.0.1) |
| chessground 9.2.1 | lichess.org | GPL-3.0-or-later | [lichess-org/chessground v9.2.1](https://github.com/lichess-org/chessground/tree/v9.2.1) |
| Figurensatz „cburnett“ | Colin M. L. Burnett | GPL-2.0-or-later | über chessground |
| chess.js 1.4.0 | Jeff Hlywa | BSD-2-Clause | [jhlywa/chess.js v1.4.0](https://github.com/jhlywa/chess.js/tree/v1.4.0) |
| qrcode-generator 2.0.4 | Kazuhiko Arase | MIT | [kazuhikoarase/qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) |
| Bun 1.4.5 (Laufzeitumgebung der Programmdatei) | Oven und Mitwirkende | MIT | [oven-sh/bun](https://github.com/oven-sh/bun) |

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

Im Quiz bleiben die Namen und Züge der Spieler auf dem Rechner des Trainers und gehen nicht ins Internet.
Sie werden gelöscht, wenn der Raum geschlossen oder SilentBoard beendet wird.

Sicherheitslücken bitte wie in [`SECURITY.md`](SECURITY.md) beschrieben melden.
