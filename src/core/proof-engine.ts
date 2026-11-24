import type { CheckResult, ResearchDocument } from "../types.js";

const USER_AGENT = "Naser2Shell/2.1 (authorized-security-assessment)";
const TIMEOUT_MS = 5_000;

async function request(url: URL, method: "GET" | "OPTIONS", headers: Record<string, string> = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method, redirect: "manual", signal: controller.signal, headers: { "User-Agent": USER_AGENT, ...headers } });
  } finally {
    clearTimeout(timer);
  }
}

/** Non-mutating live metadata proofs only. No form submissions, auth attempts, uploads, token replay or race writes. */
export async function runLiveProofs(target: URL, docs: ResearchDocument[], onProgress?: (result: CheckResult) => void): Promise<CheckResult[]> {
  const sourceFiles = (id: string): string[] => docs.filter(doc => new RegExp(`^${id}\\b`).test(doc.finding)).map(doc => doc.file);
  const results: CheckResult[] = [];\n  const emit = (result: CheckResult): void => { results.push(result); onProgress?.(result); };
  try {
    const response = await request(target, "OPTIONS", {
      Origin: "https://naser2shell-proof.invalid",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type,authorization"
    });
    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowCredentials = response.headers.get("access-control-allow-credentials");
    const permissive = allowOrigin === "https://naser2shell-proof.invalid" ||
      (allowOrigin === "*" && allowCredentials?.toLowerCase() === "true");
    results.push({
      finding: "010",
      title: "CORS-Origin-Policy (OPTIONS-Proof)",
      status: permissive ? "POTENTIAL" : "REVIEW_REQUIRED",
      detail: `OPTIONS / → HTTP ${response.status}; Access-Control-Allow-Origin=${allowOrigin ?? "nicht gesetzt"}; Access-Control-Allow-Credentials=${allowCredentials ?? "nicht gesetzt"}. Ein permissiver Preflight ist ein Hinweis, allein aber kein Nachweis eines ausnutzbaren Datenzugriffs.`,
      sourceFiles: sourceFiles("010")
    });
  } catch (error) {
    results.push({
      finding: "010", title: "CORS-Origin-Policy (OPTIONS-Proof)", status: "REVIEW_REQUIRED",
      detail: `CORS-Metadatenprüfung nicht möglich: ${error instanceof Error ? error.message : "Unbekannter Fehler"}.`,
      sourceFiles: sourceFiles("010")
    });
  }

  const deferred: Array<[string, string, string]> = [
    ["001", "Payload Secret", "Erfordert Quellcode-/Deployment-Prüfung; ein Secret lässt sich aus einer öffentlichen HTTP-Antwort nicht sicher nachweisen."],
    ["002", "Login-Rate-Limit", "Keine Login-Versuche oder Passworttests gegen Live-Systeme."],
    ["003", "Thumbnail-Ressourcenverbrauch", "Keine ressourcenintensiven Bild-/URL-Aufrufe oder Lasttests."],
    ["004", "Kontaktformular-Rate-Limit", "Keine Formularübermittlung und keine E-Mail-/Workflow-Auslösung."],
    ["005", "Upload-Kontingent", "Keine Dateien oder Blob-Tokens werden übertragen."],
    ["007", "Preview-CSRF", "Keine potenziell zustandsändernden GET-Aufrufe oder CSRF-Auslösung."],
    ["008", "JWT-Client-Bindung", "Keine Token-Replays oder fremden Session-Tokens."],
    ["009", "Feedback Lost Update", "Keine parallelen schreibenden Requests oder Race-Condition-Tests."]
  ];
  for (const [id, title, detail] of deferred) emit({
    finding: id, title: `${title} – Proof zurückgestellt`, status: "REVIEW_REQUIRED",
    detail: `${detail} Benötigt einen ausdrücklich freigegebenen, isolierten Testablauf mit Testkonto/-daten und Cleanup.`,
    sourceFiles: sourceFiles(id)
  });
  return results;
}
