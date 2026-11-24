import type { CheckResult, Mode, ResearchDocument } from "../types.js";
import { checkDomain } from "./domain-check.js";

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
  ["011", "Fehlende Security-Header", "REVIEW_REQUIRED", "Bei DOMAIN nur passive Header-Auswertung per einzelner HEAD-Anfrage."]
] as const;

export async function runChecks(mode: Mode, target: string, docs: ResearchDocument[]): Promise<CheckResult[]> {
  const byFinding = new Map<string, string[]>();
  for (const doc of docs) {
    const match = doc.finding.match(/^(\d{3})/);
    if (match) byFinding.set(match[1], [...(byFinding.get(match[1]) ?? []), doc.file]);
  }
  const results: CheckResult[] = findings.map(([finding, title, status, detail]) => ({
    finding,
    title,
    status,
    detail,
    sourceFiles: byFinding.get(finding) ?? []
  }));
  if (mode === "LOCAL") {
    return results.map(item => {
      if (["001", "006", "010", "011"].includes(item.finding)) {
        return { ...item, detail: `${item.detail} Automatischer lokaler Dateiscan ist in dieser Version noch nicht implementiert.` };
      }
      return item;
    });
  }
  const url = new URL(target);
  const domainResults = await checkDomain(url);
  return results.map(item => domainResults.find(check => check.finding === item.finding) ?? item);
}