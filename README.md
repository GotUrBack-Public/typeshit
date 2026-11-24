# Naser2Shell

TypeScript-Tool zum strukturierten Auswerten der ZeroDay-Library. Aktive, zustandsändernde oder belastende PoCs werden nicht ausgeführt.

## Termux

```sh
pkg update && pkg install nodejs git
git clone https://github.com/GotUrBack-Public/typeshit.git
cd typeshit
npm install
npm start
```

## Linux

```sh
sudo apt install nodejs npm git
git clone https://github.com/GotUrBack-Public/typeshit.git
cd typeshit
npm install
npm start
```

## Research-Library

Lege die Library neben Naser2Shell oder gib ihren Pfad beim Start an:

```sh
git clone https://github.com/GotUrBack-Public/ZeroDay-Library-naser.solutions-23.11.2026.git
npm start
```

Im Menü LOCAL oder DOMAIN wählen. DOMAIN benötigt vor jedem Lauf die ausdrückliche Eingabe `JA`. Ohne Bestätigung wird abgebrochen. Ergebnisse landen unter `reports/`.

DOMAIN-Prüfungen beschränken sich auf eine einzelne HEAD-Anfrage und die Auswertung sicherer HTTP-Header. Gefährliche PoCs, Login-Versuche, Uploads, Formularübermittlungen, Race- und Lasttests werden nicht ausgeführt.
