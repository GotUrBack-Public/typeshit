import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 0 || b === 168)) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    return true;
  }
  if (version === 6) {
    const value = address.toLowerCase();
    if (value === "::" || value === "::1" || value.startsWith("fc") ||
        value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") ||
        value.startsWith("fea") || value.startsWith("feb") || value.startsWith("ff")) return false;
    if (value.startsWith("::ffff:")) return isPublicAddress(value.slice(7));
    return true;
  }
  return false;
}

export function normalizeDomain(input: string): URL {
  const raw = input.trim();
  if (!raw) throw new Error("Kein Domain-Ziel angegeben.");
  const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Nur HTTP und HTTPS sind erlaubt.");
  if (url.username || url.password) throw new Error("Zugangsdaten in URLs sind nicht erlaubt.");
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("Bitte nur eine Domain ohne Pfad, Query oder Fragment angeben.");
  if (!url.hostname.includes(".") || url.hostname === "localhost") throw new Error("Bitte eine gültige öffentliche Domain angeben.");
  if (isIP(url.hostname) && !isPublicAddress(url.hostname)) throw new Error("Private oder reservierte IP-Adressen sind als DOMAIN-Ziel gesperrt.");
  if ([".localhost", ".local", ".internal", ".test"].some(suffix => url.hostname.endsWith(suffix))) {
    throw new Error("Lokale oder reservierte Hostnamen sind als DOMAIN-Ziel gesperrt.");
  }
  return url;
}

export async function assertPublicTarget(url: URL): Promise<void> {
  if (isIP(url.hostname)) {
    if (!isPublicAddress(url.hostname)) throw new Error("Private oder reservierte IP-Adressen sind als DOMAIN-Ziel gesperrt.");
    return;
  }
  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => !isPublicAddress(record.address))) {
    throw new Error("Das Ziel löst auf eine private oder reservierte Adresse auf; DOMAIN wurde vor dem Netzwerkzugriff gestoppt.");
  }
}
