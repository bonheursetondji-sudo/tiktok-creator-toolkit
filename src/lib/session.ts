/**
 * Signature du cookie de session, en Web Crypto (SubtleCrypto) plutôt que
 * node:crypto : ce module est importé par middleware.ts, qui s'exécute en
 * Edge runtime et n'a pas accès aux modules natifs Node. Web Crypto est
 * disponible à la fois côté Edge et côté Node 18+, donc une seule
 * implémentation suffit pour les deux contextes.
 */

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error(
      "APP_SECRET manquant. Générez-en un avec `openssl rand -hex 32` et ajoutez-le à votre .env."
    );
  }
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sign(value: string): Promise<string> {
  const key = await getKey();
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return `${value}.${toHex(mac)}`;
}

export async function unsign(signed: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const mac = signed.slice(lastDot + 1);
  const key = await getKey();
  const expectedMac = toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  if (mac.length !== expectedMac.length) return null;
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expectedMac.charCodeAt(i);
  return diff === 0 ? value : null;
}

export const SESSION_COOKIE = "tct_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

/** Construit la valeur signée à poser dans le cookie de session. */
export async function createSessionValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return sign(`ok:${expiresAt}`);
}

/** Vérifie la valeur du cookie de session (utilisé par le middleware). */
export async function isSessionValid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const unsigned = await unsign(cookieValue);
  if (!unsigned || !unsigned.startsWith("ok:")) return false;
  const expiresAt = Number(unsigned.slice(3));
  if (!Number.isFinite(expiresAt)) return false;
  return Date.now() < expiresAt;
}
