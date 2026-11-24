# Naser2Shell

TypeScript-Tool zur Auswertung der [ZeroDay-Library](https://github.com/GotUrBack-Public/ZeroDay-Library-naser.solutions-23.11.2026).

## Status: DOMAIN Engine V2

DOMAIN führt eine begrenzte, automatisierte Same-Origin-Inventarisierung aus:

- GET auf Startseite, `robots.txt`, `sitemap.xml` und Security-Contact-Dateien
- Auswertung von HTTP-Sicherheitsheadern und öffentlich gesetzten Cookie-Attributen
- Erkennung von same-origin Links/Pfaden sowie Formularen und Passwortfeldern
- Erkennung externer Formularziele, ohne diese aufzurufen
- JSON- und Markdown-Reports

Die Engine übermittelt keine Formulare, führt keine Login-Versuche oder Uploads aus und verwendet keine zustandsändernden HTTP-Methoden. Keine Race-, Last-, Brute-Force-, Fuzzing- oder Exploit-Tests. Diese Prüfklassen benötigen separat freigegebene Testkonten, Testdaten und eine isolierte bzw. ausdrücklich dafür vorgesehene Testumgebung; sie werden nicht durch einen pauschalen Domain-Scan aktiviert.

## Sicherheitsgrenzen

- DOMAIN verlangt vor jedem Lauf eine ausdrückliche Autorisierungsbestätigung.
- Requests bleiben auf dem eingegebenen Origin; Redirects werden nicht automatisch verfolgt.
- Anzahl und Laufzeit der Requests sowie gelesene Antwortgrößen sind begrenzt.
- HTML-Formulare werden ausschließlich inventarisiert, niemals abgesendet.
- Findings aus der Research-Library werden nicht allein aufgrund ihres Vorhandenseins als bestätigt markiert.

## Termux

```sh
pkg update && pkg install nodejs git
git clone https://github.com/GotUrBack-Public/typeshit.git
cd typeshit && npm install
git clone https://github.com/GotUrBack-Public/ZeroDay-Library-naser.solutions-23.11.2026.git ../ZeroDay-Library-naser.solutions-23.11.2026
npm start
```

## Linux

```sh
sudo apt install nodejs npm git
git clone https://github.com/GotUrBack-Public/typeshit.git
cd typeshit && npm install
git clone https://github.com/GotUrBack-Public/ZeroDay-Library-naser.solutions-23.11.2026.git ../ZeroDay-Library-naser.solutions-23.11.2026
npm start
```

LOCAL fragt nach dem lokalen Projektpfad. DOMAIN fragt nach einer ausdrücklichen Autorisierung; nur die exakte Eingabe `JA` startet den Lauf. Reports liegen in `reports/`.
