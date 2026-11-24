#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const entry = path.join(root, "src/index.ts");
const REPOSITORY = "GotUrBack-Public/typeshit";
const EXPECTED_REMOTES = new Set([
  `https://github.com/${REPOSITORY}.git`,
  `https://github.com/${REPOSITORY}`,
  `git@github.com:${REPOSITORY}.git`
]);

function git(args) {
  return spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 60_000 });
}

function updateFromMain() {
  const inside = git(["rev-parse", "--is-inside-work-tree"]);
  if (inside.error || inside.status !== 0 || inside.stdout.trim() !== "true") {
    console.log("[update] Kein Git-Checkout erkannt; automatisches Update übersprungen.");
    return;
  }

  const remote = git(["remote", "get-url", "origin"]);
  if (remote.status !== 0 || !EXPECTED_REMOTES.has(remote.stdout.trim())) {
    console.log("[update] Origin stimmt nicht mit dem offiziellen Repository überein; Update übersprungen.");
    return;
  }

  const status = git(["status", "--porcelain"]);
  if (status.status !== 0 || status.stdout.trim()) {
    console.log("[update] Lokale Änderungen erkannt; Update übersprungen, damit nichts überschrieben wird.");
    return;
  }

  const fetch = git(["fetch", "--quiet", "origin", "main"]);
  if (fetch.status !== 0) {
    console.log("[update] GitHub nicht erreichbar oder Fetch fehlgeschlagen; starte installierte Version.");
    return;
  }

  const counts = git(["rev-list", "--left-right", "--count", "HEAD...origin/main"]);
  if (counts.status !== 0) {
    console.log("[update] Versionsvergleich fehlgeschlagen; starte installierte Version.");
    return;
  }
  const [ahead, behind] = counts.stdout.trim().split(/\s+/).map(Number);
  if (!Number.isFinite(ahead) || !Number.isFinite(behind)) {
    console.log("[update] Ungültige Versionsinformation; starte installierte Version.");
    return;
  }
  if (behind === 0) {
    console.log("[update] Naser2Shell ist auf dem aktuellen Repo-Stand.");
    return;
  }
  if (ahead !== 0) {
    console.log("[update] Lokaler Branch weicht von main ab; kein automatisches Merge ausgeführt.");
    return;
  }

  console.log(`[update] Neue Version gefunden (${behind} Commit(s)); aktualisiere fast-forward...`);
  const pull = git(["pull", "--ff-only", "origin", "main"]);
  if (pull.status !== 0) {
    console.log("[update] Fast-forward-Update fehlgeschlagen; starte vorhandene Version.");
    return;
  }
  const install = spawnSync("npm", ["install"], { cwd: root, stdio: "inherit", timeout: 180_000 });
  if (install.error || install.status !== 0) {
    console.error("[update] Abhängigkeiten konnten nicht aktualisiert werden. Bitte npm install manuell ausführen.");
    process.exit(1);
  }
  console.log("[update] Update abgeschlossen.");
}

updateFromMain();

const child = spawn(process.execPath, ["--import", "tsx", entry, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit"
});
child.on("error", error => {
  console.error(`Naser2Shell konnte nicht gestartet werden: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", code => {
  process.exitCode = code ?? 1;
});
