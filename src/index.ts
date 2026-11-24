import path from "node:path";
import { existsSync } from "node:fs";
import { ask, closePrompt } from "./cli.js";
import { createProgress } from "./cli/progress.js";
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
  const args = process.argv.slice(2);
  const valueAfter = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const exploitCommand = args[0] === "exploit";
  const targetArg = exploitCommand ? args[1] : valueAfter("--target");
  const selector = exploitCommand ? args[2] : (args.includes("--all") ? "zerodays#all" : undefined);
  const forceCampaign = args.includes("--force");
  const allFindings = selector === "zerodays#all";
  let mode: Mode;
  if (exploitCommand) {
    if (!targetArg || !allFindings) {
      throw new Error("Verwendung: naser2shell exploit <url> zerodays#all --force");
    }
    if (!forceCampaign) {
      throw new Error("Für eine vollständige sequenzielle Kampagne muss --force angegeben werden. Autorisierungsprüfungen bleiben trotzdem verpflichtend.");
    }
    mode = "DOMAIN";
    console.log("Modus: vollständige sequenzielle ZeroDay-Proof-Kampagne (--force)");
  } else if (targetArg && args.includes("--all")) {
    mode = "DOMAIN";
    console.log("Modus: vollständiger DOMAIN-Lauf (--all)");
  } else if (args.length === 0) {
    console.log("1) LOCAL");
    console.log("2) DOMAIN");
    const choice = await ask("Modus: ");
    if (choice !== "1" && choice !== "2") throw new Error("Ungültige Auswahl.");
    mode = choice === "1" ? "LOCAL" : "DOMAIN";
  } else {
    throw new Error("Verwendung: naser2shell exploit <url> zerodays#all --force");
  }
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
    const url = normalizeDomain(targetArg ?? await ask("Zieldomain: "));
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
    const authorizationPhrase = `AUTORISIERT ${url.hostname}`;
    const answer = await ask(`Bist du Eigentümer oder ausdrücklich zur Prüfung autorisiert? Tippe exakt "${authorizationPhrase}": `);
    const scopePhrase = `LIVE-PROOF ${url.hostname}`;
    const scopeAnswer = answer === authorizationPhrase
      ? await ask(`Bestätige den Live-Proof-Umfang (nur nicht-mutierende Prüfungen). Tippe exakt "${scopePhrase}": `)
      : "";
    if (answer !== authorizationPhrase || scopeAnswer !== scopePhrase) {
      const report: RunReport = {
        tool: "Naser2Shell",
        startedAt,
        finishedAt: new Date().toISOString(),
        mode,
        target,
        authorization,
        researchFiles: 0,
        results: [{ finding: "AUTH", title: "Autorisierungsprüfung", status: "BLOCKED", detail: "Zielgebundene Autorisierung oder Live-Proof-Umfang nicht exakt bestätigt; es wurde kein Netzwerkzugriff ausgeführt.", sourceFiles: [] }]
      };
      const base = await saveReport(report);
      throw new Error(`Abgebrochen. Kein DOMAIN-Scan. Abbruchbericht: ${base}.md`);
    }
    authorization = {
      ...authorization,
      confirmed: true,
      answer: `${authorizationPhrase}; ${scopePhrase}`,
      confirmedAt: new Date().toISOString()
    };
    await assertPublicTarget(url);
  } else {
    const sourceInput = await ask("Pfad zum lokalen Projekt: ");
    sourceRoot = path.resolve(sourceInput || ".");
    if (!existsSync(sourceRoot)) throw new Error("Lokaler Projektpfad nicht gefunden.");
  }
  const defaultResearch = path.resolve("../ZeroDay-Library-naser.solutions-23.11.2026/english");
  const researchInput = valueAfter("--research") ?? await ask(`Pfad zur Research-Library [${defaultResearch}]: `);
  const researchRoot = path.resolve(researchInput || defaultResearch);
  if (!existsSync(researchRoot)) throw new Error(`Research-Pfad nicht gefunden: ${researchRoot}`);
  const docs = await loadResearch(researchRoot);
  if (!docs.length) throw new Error("Keine Markdown-Dateien in der Research-Library gefunden.");
  console.log(`\nStarte sequenzielle Prüfung aller ${docs.length} Research-Dateien / Findings...\`);
  const progress = mode === "DOMAIN" ? createProgress(12) : undefined;
  if (progress) console.log("\n\n\n\n\n\n");
  const results = await runChecks(mode, target, docs, sourceRoot, progress ? result => progress(result.finding, result.title, result.status) : undefined);
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