export function normalizeDomain(input: string): URL {
  const raw = input.trim();
  if (!raw) throw new Error("Kein Domain-Ziel angegeben.");
  const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Nur HTTP und HTTPS sind erlaubt.");
  if (url.username || url.password) throw new Error("Zugangsdaten in URLs sind nicht erlaubt.");
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("Bitte nur eine Domain ohne Pfad, Query oder Fragment angeben.");
  if (!url.hostname.includes(".") || url.hostname === "localhost") throw new Error("Bitte eine gültige öffentliche Domain angeben.");
  return url;
}