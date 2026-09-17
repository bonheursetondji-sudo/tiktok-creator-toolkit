/**
 * Signature du cookie de session, en Web Crypto (SubtleCrypto) plutôt que
 * node:crypto : ce module est importé par proxy.ts. Web Crypto est
 * disponible à la fois côté Edge et côté Node 18+, donc une seule
 * implémentation suffit pour les deux contextes.
 *
 * Le cookie encode désormais l'identifiant de l'utilisateur connecté
 * (multi-utilisateur), pas juste "connecté ou non".
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

/** Construit la valeur signée à poser dans le cookie de session pour cet utilisateur. */
export async function createSessionValue(userId: number): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return sign(`u:${userId}:${expiresAt}`);
}

/**
 * Vérifie la valeur du cookie de session et retourne l'userId qu'il
 * encode, ou null si absent/invalide/expiré. Utilisé par le middleware
 * (juste pour savoir si "quelqu'un" est connecté, sans toucher la base)
 * et par getCurrentUser() (qui, lui, va chercher l'utilisateur complet).
 */
export async function getSessionUserId(cookieValue: string | undefined): Promise<number | null> {
  if (!cookieValue) return null;
  const unsigned = await unsign(cookieValue);
  if (!unsigned || !unsigned.startsWith("u:")) return null;
  const [, userIdStr, expiresAtStr] = unsigned.split(":");
  const userId = Number(userIdStr);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(userId) || !Number.isFinite(expiresAt)) return null;
  if (Date.now() >= expiresAt) return null;
  return userId;
}

/** Vérifie juste la validité du cookie, sans avoir besoin de l'userId (proxy.ts). */
export async function isSessionValid(cookieValue: string | undefined): Promise<boolean> {
  return (await getSessionUserId(cookieValue)) !== null;
}
