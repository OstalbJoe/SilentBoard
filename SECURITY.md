# Sicherheit

SilentBoard läuft auf dem Rechner des Trainers, hat keine Benutzerkonten und sammelt keine Daten.

- **Nach dem Start** hört das Programm nur auf den eigenen Rechner (`127.0.0.1`). Aus dem Netzwerk ist nichts erreichbar.
- **Erst „Raum öffnen“ im Quiz** startet einen zweiten, im WLAN erreichbaren Teil. Er liefert nur die Seite für
  die Handys aus und nimmt Anmeldungen (mit Raum-Code) und Züge entgegen. Steuern lässt sich das Quiz nur vom Rechner
  des Trainers. „Raum schließen“ oder das Beenden von SilentBoard schließt diesen Teil wieder.
- Netzwerkverbindungen ins Internet gibt es nur zu `lichess.org` (beim Laden eines Lichess-Links); eine
  Content-Security-Policy in der Seite lässt keine anderen Ziele zu.

## Sicherheitslücke gefunden?

Bitte **kein öffentliches Issue** anlegen, sondern über GitHub privat melden:
Reiter „Security“ → „Report a vulnerability“ in diesem Repository.

Es gibt keine Garantie auf eine Antwort oder Behebung innerhalb einer bestimmten Frist –
SilentBoard ist ein kostenloses Freizeitprojekt (siehe Haftungsausschluss in der README).
