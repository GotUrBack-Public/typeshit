import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type PayloadDisposition = "BLOCKED_ACTIVE" | "REVIEW_REQUIRED";

export interface PayloadCorpus {
  total: number;
  unique: number;
  blockedActive: number;
  reviewRequired: number;
  entries: Array<{ line: number; value: string; disposition: PayloadDisposition }>;
}

const ACTIVE_PAYLOAD = /<\\s*(?:script|iframe|object|embed|svg|img|audio|video|body|input|link|meta)\\b|on(?:error|load|click|mouseover|focus|begin)\\s*=|javascript\\s*:|document\\s*\\.\\s*cookie|(?:fetch|XMLHttpRequest|WebSocket)\\s*\\(|\\beval\\s*\\(|\\b(?:alert|prompt|confirm)\\s*\\(|location\\s*=|document\\s*\\.\\s*write|attacker\\.com|ha\\.ckers\\.org|biznet\\.com\\.tr/i;

/**
 * Loads the historical XSS corpus as data. Entries are never executed by this
 * module; active browser payloads are quarantined from automatic live requests.
 */
export async function loadPayloadCorpus(): Promise<PayloadCorpus> {
  const file = fileURLToPath(new URL("./payloads.txt", import.meta.url));
  const raw = await readFile(file, "utf8");
  const entries = raw.split(/\\r?\\n/).flatMap((value, index) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith("#")) return [];
    return [{
      line: index + 1,
      value: trimmed,
      disposition: (ACTIVE_PAYLOAD.test(trimmed) ? "BLOCKED_ACTIVE" : "REVIEW_REQUIRED") as PayloadDisposition
    }];
  });
  return {
    total: entries.length,
    unique: new Set(entries.map(entry => entry.value)).size,
    blockedActive: entries.filter(entry => entry.disposition === "BLOCKED_ACTIVE").length,
    reviewRequired: entries.filter(entry => entry.disposition === "REVIEW_REQUIRED").length,
    entries
  };
}
