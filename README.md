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

- DOMAIN verlangt eine zielgebundene Autorisierungsphrase (`AUTORISIERT <hostname>`) und eine zweite, getrennte Freigabe des Live-Proof-Umfangs (`LIVE-PROOF <hostname>`). Das ist eine bewusste Bestätigung, keine kryptografische 2FA.
- Requests bleiben auf dem eingegebenen Origin; Redirects werden nicht automatisch verfolgt.
- Anzahl und Laufzeit der Requests sowie gelesene Antwortgrößen sind begrenzt.
- HTML-Formulare werden ausschließlich inventarisiert, niemals abgesendet.
- Findings aus der Research-Library werden nicht allein aufgrund ihres Vorhandenseins als bestätigt markiert.
- Live-Proofs verwenden aktuell ausschließlich nicht-mutierende Metadatenprüfungen. CORS wird per OPTIONS-Preflight untersucht. Login-, Upload-, Formular-, CSRF-, JWT-Replay-, Race- und Lasttests werden nicht gegen Live-Ziele ausgeführt.

## Ein-Befehl-Modus

Nach der Installation kannst du den vollständigen DOMAIN-Lauf mit einem Befehl starten:

```sh
naser2shell exploit https://example.com zerodays#all --force
```

Naser2Shell liest dann die gesamte konfigurierte Research-Library ein und verarbeitet die Finding-Liste sequenziell in einem Lauf. `--force` aktiviert die vollständige Kampagne, hebt aber weder die zielgebundene Autorisierungsabfrage noch die Sicherheitsgrenzen der einzelnen Proof-Module auf. Die Kurzform setzt voraus, dass `naser2shell` global installiert oder als ausführbares CLI verfügbar ist; alternativ kann der Aufruf über das npm-Script erfolgen. Die zielgebundenen Autorisierungsbestätigungen werden weiterhin interaktiv abgefragt. `--research /pfad/zur/english-library` kann optional den Library-Pfad festlegen. Einzelne Finding-Klassen, die aktive Schreibzugriffe, Login-Versuche, Uploads, CSRF-Auslösung, Token-Replay oder Last/Race-Verhalten erfordern, werden im aktuellen Stand ausdrücklich als zurückgestellt dokumentiert und nicht als erfolgreich geprüft ausgegeben.

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

LOCAL fragt nach dem lokalen Projektpfad. DOMAIN verlangt zwei zielgebundene Eingaben: `AUTORISIERT <hostname>` und `LIVE-PROOF <hostname>`. Die zweite Freigabe gilt ausdrücklich nur für nicht-mutierende Live-Prüfungen. Reports liegen in `reports/`.
