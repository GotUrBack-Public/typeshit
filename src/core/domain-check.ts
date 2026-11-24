import type { CheckResult } from "../types.js";

export async function checkDomain(url: URL): Promise<CheckResult[]> {
  const result: CheckResult[] = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "Naser2Shell/1.0 security-review" }
    });
    const headers = response.headers;
    const missing = [
      ["Strict-Transport-Security", "HSTS"],
      ["Content-Security-Policy", "CSP"],
      ["X-Content-Type-Options", "X-Content-Type-Options"],
      ["X-Frame-Options", "X-Frame-Options"],
      ["Referrer-Policy", "Referrer-Policy"]
    ].filter(([header]) => !headers.has(header));
    result.push({
      finding: "011",
      title: "HTTP-Sicherheitsheader",
      status: missing.length ? "FINDING" : "PASS",
      detail: `HTTP ${response.status}; fehlend: ${missing.map(x => x[1]).join(", ") || "keine"}`,
      sourceFiles: ["next.config.mjs"]
    });
    result.push({
      finding: "006",
      title: "Cookie-Attribute",
      status: "REVIEW_REQUIRED",
      detail: "Eine HEAD-Antwort belegt keine Session-Cookie-Konfiguration. Cookies müssen in einem autorisierten lokalen Test geprüft werden.",
      sourceFiles: ["lib/portal-session.ts"]
    });
  } catch (error) {
    result.push({
      finding: "DOMAIN",
      title: "HTTP-Erreichbarkeit",
      status: "ERROR",
      detail: error instanceof Error ? error.message : "Unbekannter Netzwerkfehler",
      sourceFiles: []
    });
  } finally {
    clearTimeout(timer);
  }
  return result;
}