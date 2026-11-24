import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { CheckResult, Mode, ResearchDocument } from "../types.js";
import { checkDomain } from "./domain-check.js";
import { runLiveProofs } from "./proof-engine.js";

const findings = [
  ["001", "Payload Secret leerer Standardwert", "REVIEW_REQUIRED", "Quellcode und Deployment-Konfiguration lokal prüfen."],
  ["002", "Portal-Login ohne eigenes Rate-Limit", "BLOCKED", "Keine Login-Versuche oder Passworttests gegen Live-Systeme."],
  ["003", "Thumbnail-Endpoint und Ressourcenverbrauch", "BLOCKED", "Keine URL-Floods, externen Abrufe oder Ressourcenerschöpfung."],
  ["004", "Kontaktformular ohne Rate-Limit", "BLOCKED", "Keine Formularübermittlungen oder SMTP-Auslösung."],
  ["005", "Upload ohne Benutzerkontingent", "BLOCKED", "Keine Uploads oder Blob-Token-Erzeugung gegen Live-Systeme."],
  ["006", "Session-Cookie-Attribute", "REVIEW_REQUIRED", "Sichere Prüfung nur anhand lokaler Konfiguration oder explizit bereitgestellter Testantworten."],
  ["007", "Preview-CSRF über GET", "BLOCKED", "Keine Zustandsänderung oder CSRF-PoC-Ausführung."],
  ["008", "JWT ohne Client-Bindung", "REVIEW_REQUIRED", "Erfordert autorisierte Architektur- und Konfigurationsprüfung; kein Token-Replay."],
  ["009", "Feedback Lost Update", "BLOCKED", "Keine parallelen schreibenden Requests oder Race-Tests."],
  ["010", "CMS-Origin-Allowlist", "REVIEW_REQUIRED", "Lokale Prüfung der Origin-Konfiguration."],
  ["011", "Fehlende Security-Header", "REVIEW_REQUIRED", "Bei DOMAIN begrenzte passive GET-Prüfung der Startseite und definierter Metadatenpfade."]
] as const;

async function sourceFiles(root: string): Promise<string[]> {
  const output: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) output.push(full);
    }
  }
  await walk(root);
  return output;
}

async function localSourceChecks(root: string, docs: ResearchDocument[]): Promise<CheckResult[]> {
  const files = await sourceFiles(root);
  const contents = new Map<string, string>();
  for (const file of files) {
    try {
      contents.set(file.replaceAll("\\", "/"), await readFile(file, "utf8"));
    } catch {}
  }
  const rules: Record<string, { file: RegExp; pattern: RegExp; absent: boolean }> = {
    "001": { file: /payload\.config\.(ts|js)$/, pattern: /secret\s*:\s*process\.env\.PAYLOAD_SECRET\s*\|\|\s*['"]{2}/, absent: false },
    "006": { file: /portal-session\.(ts|js)$/, pattern: /httpOnly\s*:\s*true/, absent: false },
    "009": { file: /portal\/actions\.(ts|tsx|js)$/, pattern: /readFile|read\(|findByID|findOne/i, absent: false },
    "010": { file: /cms-origins\.(ts|js)$/, pattern: /\.origin/, absent: false },
    "011": { file: /next\.config\.(mjs|js|ts)$/, pattern: /headers\s*\(/, absent: true }
  };
  const output: CheckResult[] = [];
  for (const [id, title] of [["001","Payload Secret"],["006","Session-Cookie"],["009","Feedback Lost Update"],["010","CMS-Origin-Allowlist"],["011","Security-Header"]] as const) {
    const rule = rules[id];
    const matched = [...contents.entries()].filter(([file]) => rule.file.test(file));
    if (!matched.length) {
      output.push({ finding: id, title, status: "REVIEW_REQUIRED", detail: "Passende Quelldatei im angegebenen Projektpfad nicht gefunden.", sourceFiles: [] });
      continue;
    }
    const hit = matched.some(([, content]) => rule.pattern.test(content));
    const finding = rule.absent ? !hit : hit;
    output.push({
      finding: id,
      title,
      status: finding ? "FINDING" : "PASS",
      detail: finding ? "Statisches Muster gefunden; manuelle Validierung erforderlich." : "Gesuchtes Muster nicht gefunden.",
      sourceFiles: matched.map(([file]) => path.relative(root, file))
    });
  }
  return output;
}

export async function runChecks(mode: Mode, target: string, docs: ResearchDocument[], sourceRoot?: string, onProgress?: (result: CheckResult) => void): Promise<CheckResult[]> {
  const byFinding = new Map<string, string[]>();
  for (const doc of docs) {
    const match = doc.finding.match(/^(\d{3})/);
    if (match) byFinding.set(match[1], [...(byFinding.get(match[1]) ?? []), doc.file]);
  }
  let results: CheckResult[] = findings.map(([finding, title, status, detail]) => ({
    finding,
    title,
    status,
    detail,
    sourceFiles: byFinding.get(finding) ?? []
  }));
  if (mode === "LOCAL") {
    if (!sourceRoot) return results;
    const local = await localSourceChecks(sourceRoot, docs);
    return results.map(item => local.find(check => check.finding === item.finding) ?? item);
  }
  const domainResults = await checkDomain(new URL(target));
  const liveProofs = await runLiveProofs(new URL(target), docs);
  const combined = [...domainResults, ...liveProofs];
  const ordered = results.map(item => combined.find(check => check.finding === item.finding) ?? item);
  for (const result of ordered) onProgress?.(result);
  return [
    ...ordered,
    ...combined.filter(check => !results.some(item => item.finding === check.finding))
  ];
}