/** True for loopback, link-local, and private LAN addresses (not usable for geo lookup). */
export function isNonRoutableIp(ip: string | null | undefined): boolean {
  const raw = String(ip ?? "").trim();
  if (!raw) return true;

  const v4Mapped = raw.toLowerCase().startsWith("::ffff:")
    ? raw.slice(7)
    : raw;

  if (v4Mapped === "::1" || v4Mapped === "127.0.0.1" || v4Mapped === "0.0.0.0") {
    return true;
  }

  if (v4Mapped.includes(".")) {
    const parts = v4Mapped.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
      return false;
    }
    const [a, b] = parts;
    if (a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  const lower = raw.toLowerCase();
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;

  return false;
}

export function resolveClientIp(request: Request): string | null {
  const candidates: string[] = [];

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = part.trim();
      if (ip && ip.toLowerCase() !== "unknown") candidates.push(ip);
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.toLowerCase() !== "unknown") candidates.push(realIp);

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) candidates.push(cfIp);

  for (const ip of candidates) {
    if (!isNonRoutableIp(ip)) return ip;
  }

  return null;
}

export function ipQueryLookupUrl(clientIp: string | null | undefined): string {
  const base = "https://api.ipquery.io";
  const ip = String(clientIp ?? "").trim();
  if (ip && !isNonRoutableIp(ip)) {
    return `${base}/${encodeURIComponent(ip)}`;
  }
  return `${base}/?format=json`;
}
