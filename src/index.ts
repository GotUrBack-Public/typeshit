import path from "node:path";
import { existsSync } from "node:fs";
import { ask, closePrompt } from "./cli.js";
import { assertPublicTarget, normalizeDomain } from "./core/target.js";
import { runChecks } from "./core/engine.js";
import { loadResearch } from "./research/loader.js";
import { saveReport } from "./report.js";
import type { AuthorizationRecord, Mode, RunReport } from "./types.js";

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const color = (code: string, value: string): string =>
    process.stdout.isTTY ? `\u001b[${code}m${value}\u001b[0m` : value;
  console.log("");
  console.log(color("31", "  +------------------------------------------------------+"));
  console.log(color("31", "  |") + color("90", "                                                      ") + color("31", "|"));
  console.log(color("31", "  |   ") + color("31;1", "N A S E R") + color("90;1", " 2 ") + color("97;1", "S H E L L") + color("31", "                         |"));
  console.log(color("31", "  |") + color("90", "       AUTHORIZED SECURITY RESEARCH CLI               ") + color("31", "|"));
  console.log(color("31", "  +------------------------------------------------------+"));
  console.log("");
  console.log("1) LOCAL");
  console.log("2) DOMAIN");
  const choice = await ask("Modus: ");
  if (choice !== "1" && choice !== "2") throw new Error("Ungültige Auswahl.");
  const mode: Mode = choice === "1" ? "LOCAL" : "DOMAIN";
  let target = "local";
  let sourceRoot: string | undefined;
  let authorization: AuthorizationRecord = {
    required: false,
    confirmed: false,
    answer: null,
    domain: null,
    confirmedAt: null
  };
  if (mode === "DOMAIN") {
    const url = normalizeDomain(await ask("Zieldomain: "));
    target = url.origin;
    authorization = {
      required: true,
      confirmed: false,
      answer: null,
      domain: url.hostname,
      confirmedAt: null
    };
    console.log("\nAUTORISIERUNG ERFORDERLICH");
    console.log(`Ziel: ${url.origin}`);
    const answer = await ask("Bist du Eigentümer oder ausdrücklich zur Prüfung autorisiert? Tippe JA: ");
    if (answer !== "JA") {
      const report: RunReport = {
        tool: "Naser2Shell",
        startedAt,
        finishedAt: new Date().toISOString(),
        mode,
        target,
        authorization,
        researchFiles: 0,
        results: [{ finding: "AUTH", title: "Autorisierungsprüfung", status: "BLOCKED", detail: "Keine exakte JA-Bestätigung; es wurde kein Netzwerkzugriff ausgeführt.", sourceFiles: [] }]
      };
      const base = await saveReport(report);
      throw new Error(`Abgebrochen. Kein DOMAIN-Scan. Abbruchbericht: ${base}.md`);
    }
    authorization = {
      ...authorization,
      confirmed: true,
      answer: "JA",
      confirmedAt: new Date().toISOString()
    };
    await assertPublicTarget(url);
  } else {
    const sourceInput = await ask("Pfad zum lokalen Projekt: ");
    sourceRoot = path.resolve(sourceInput || ".");
    if (!existsSync(sourceRoot)) throw new Error("Lokaler Projektpfad nicht gefunden.");
  }
  const defaultResearch = path.resolve("../ZeroDay-Library-naser.solutions-23.11.2026/english");
  const researchInput = await ask(`Pfad zur Research-Library [${defaultResearch}]: `);
  const researchRoot = path.resolve(researchInput || defaultResearch);
  if (!existsSync(researchRoot)) throw new Error(`Research-Pfad nicht gefunden: ${researchRoot}`);
  const docs = await loadResearch(researchRoot);
  if (!docs.length) throw new Error("Keine Markdown-Dateien in der Research-Library gefunden.");
  const results = await runChecks(mode, target, docs, sourceRoot);
  const report: RunReport = {
    tool: "Naser2Shell",
    startedAt,
    finishedAt: new Date().toISOString(),
    mode,
    target,
    authorization,
    researchFiles: docs.length,
    results
  };
  const base = await saveReport(report);
  console.log("\nErgebnis");
  for (const result of results) console.log(`[${result.status}] ${result.finding} ${result.title}`);
  console.log(`\nReport: ${base}.md`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Fehler");
  process.exitCode = 1;
}).finally(closePrompt);