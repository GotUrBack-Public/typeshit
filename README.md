# Naser2Shell

TypeScript-Tool zur Auswertung der ZeroDay-Library.

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

LOCAL fragt nach dem lokalen Projektpfad. DOMAIN fragt vor jedem Lauf nach einer ausdrücklichen Autorisierung; nur die Eingabe `JA` startet die Prüfung. Abbrüche werden protokolliert. Reports liegen in `reports/`.
