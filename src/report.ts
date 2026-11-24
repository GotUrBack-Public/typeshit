import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RunReport } from "./types.js";

export async function saveReport(report: RunReport): Promise<string> {
  await mkdir("reports", { recursive: true });
  const stamp = report.startedAt.replace(/[:.]/g, "-");
  const base = path.join("reports", `naser2shell-${stamp}`);
  await writeFile(`${base}.json`, JSON.stringify(report, null, 2), "utf8");
  const lines = [
    "# Naser2Shell Report",
    "",
    `- Modus: ${report.mode}`,
    `- Ziel: ${report.target}`,
    `- Start: ${report.startedAt}`,
    `- Ende: ${report.finishedAt}`,
    `- Research-Dateien: ${report.researchFiles}`,
    `- Autorisierung erforderlich: ${report.authorization.required ? "Ja" : "Nein"}`,
    `- Autorisierung bestätigt: ${report.authorization.confirmed ? "Ja" : "Nein"}`,
    `- Bestätigung: ${report.authorization.answer ?? "—"}`,
    `- Bestätigt am: ${report.authorization.confirmedAt ?? "—"}`,
    "",
    "## Ergebnisse",
    "",
    "| ID | Prüfung | Status | Details |",
    "|---|---|---|---|",
    ...report.results.map(x => `| ${x.finding} | ${x.title} | ${x.status} | ${x.detail.replace(/\|/g, "/")} |`)
  ];
  await writeFile(`${base}.md`, lines.join("\n"), "utf8");
  return base;
}