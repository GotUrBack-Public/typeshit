import type { CheckResult } from "../types.js";

const USER_AGENT = "Naser2Shell/2.0 (authorized-security-assessment)";
const TIMEOUT_MS = 6_000;
const MAX_BODY_BYTES = 512_000;
const MAX_REQUESTS = 6;

interface Probe {
  path: string;
  status: number | null;
  contentType: string;
  body: string;
  headers: Headers | null;
  error?: string;
}

async function probe(origin: URL, pathname: string): Promise<Probe> {
  const url = new URL(pathname, origin);
  if (url.origin !== origin.origin) throw new Error("Cross-origin probe blocked");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.1"
      }
    });
    const contentType = response.headers.get("content-type") ?? "";
    const length = Number(response.headers.get("content-length") ?? 0);
    let body = "";
    if (length <= MAX_BODY_BYTES && /text\\/|application\\/(json|xml|xhtml\\+xml)/i.test(contentType)) {
      body = (await response.text()).slice(0, MAX_BODY_BYTES);
    } else {
      await response.body?.cancel();
    }
    return { path: pathname, status: response.status, contentType, body, headers: response.headers };
  } catch (error) {
    return { path: pathname, status: null, contentType: "", body: "", headers: null,
      error: error instanceof Error ? error.message : "Network error" };
  } finally {
    clearTimeout(timer);
  }
}

function htmlInventory(html: string, origin: URL): { links: Set<string>; forms: number; externalForms: string[]; passwordForms: number } {
  const links = new Set<string>();
  const externalForms: string[] = [];
  let forms = 0;
  let passwordForms = 0;
  for (const match of html.matchAll(/\\b(?:href|src)\\s*=\\s*["']([^"'#]+)["']/gi)) {
    try {
      const found = new URL(match[1], origin);
      if (found.origin === origin.origin && ["http:", "https:"].includes(found.protocol)) links.add(found.pathname);
    } catch { /* Ignore malformed markup. */ }
  }
  for (const match of html.matchAll(/<form\\b([^>]*)>/gi)) {
    forms++;
    const action = match[1].match(/\\baction\\s*=\\s*["']([^"']*)["']/i)?.[1] ?? "";
    const block = html.slice(match.index ?? 0, (match.index ?? 0) + 12_000);
    if (/<input\\b[^>]*type\\s*=\\s*["']password["']/i.test(block)) passwordForms++;
    try {
      const target = new URL(action || origin.href, origin);
      if (target.origin !== origin.origin) externalForms.push(target.origin);
    } catch { /* Ignore malformed action URLs. */ }
  }
  return { links, forms, externalForms: [...new Set(externalForms)], passwordForms };
}

export async function checkDomain(url: URL): Promise<CheckResult[]> {
  // Bounded same-origin GET discovery only. Forms are never submitted.
  const paths = ["/", "/robots.txt", "/sitemap.xml", "/.well-known/security.txt", "/security.txt"];
  const probes = await Promise.all(paths.slice(0, MAX_REQUESTS).map(pathname => probe(url, pathname)));
  const root = probes[0];
  const headers = root.headers;
  const results: CheckResult[] = [];

  if (headers) {
    const missing = [
      ["strict-transport-security", "HSTS"], ["content-security-policy", "CSP"],
      ["x-content-type-options", "X-Content-Type-Options"], ["x-frame-options", "X-Frame-Options"],
      ["referrer-policy", "Referrer-Policy"]
    ].filter(([header]) => !headers.has(header));
    results.push({
      finding: "011", title: "HTTP-Sicherheitsheader",
      status: missing.length ? "FINDING" : "PASS",
      detail: `GET / → HTTP ${root.status}; fehlend: ${missing.map(x => x[1]).join(", ") || "keine"}`,
      sourceFiles: []
    });

    const cookies = headers.get("set-cookie") ?? "";
    const cookieIssues: string[] = [];
    if (cookies) {
      if (!/;\\s*httponly/i.test(cookies)) cookieIssues.push("HttpOnly");
      if (!/;\\s*secure/i.test(cookies)) cookieIssues.push("Secure");
      if (!/;\\s*samesite=/i.test(cookies)) cookieIssues.push("SameSite");
    }
    results.push({
      finding: "006", title: "Cookie-Attribute (öffentliche Antwort)",
      status: cookies ? (cookieIssues.length ? "REVIEW_REQUIRED" : "PASS") : "REVIEW_REQUIRED",
      detail: cookies
        ? `Set-Cookie vorhanden; nicht eindeutig erkannte Attribute: ${cookieIssues.join(", ") || "keine"}.`
        : "Die öffentliche Startseitenantwort lieferte kein Set-Cookie. Authentifizierte Session-Cookies wurden nicht getestet.",
      sourceFiles: []
    });
  } else {
    results.push({
      finding: "DOMAIN", title: "HTTP-Erreichbarkeit", status: "ERROR",
      detail: root.error ?? "Keine HTTP-Antwort erhalten.", sourceFiles: []
    });
  }

  const inventory = root.body ? htmlInventory(root.body, url) : null;
  const successful = probes.filter(item => item.status !== null);
  results.push({
    finding: "SURFACE", title: "Passive Attack-Surface-Inventarisierung", status: "PASS",
    detail: [
      `${successful.length}/${probes.length} sichere GET-Probes beantwortet`,
      `${inventory?.links.size ?? 0} same-origin Pfade erkannt`,
      `${inventory?.forms ?? 0} Formulare erkannt (nicht übermittelt)`,
      `${inventory?.passwordForms ?? 0} Passwortformulare erkannt (nicht getestet)`,
      `${inventory?.externalForms.length ?? 0} externe Formularziele erkannt (nicht kontaktiert)`,
      `Metadaten: ${probes.filter(item => item.status !== null && item.path !== "/").map(item => `${item.path}=${item.status}`).join(", ") || "keine"}`
    ].join("; "),
    sourceFiles: []
  });
  return results;
}
