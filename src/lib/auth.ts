import crypto from "node:crypto";

/**
 * Authentification multi-utilisateur : mot de passe individuel par
 * compte, haché avec scrypt (module natif Node, pas de dépendance
 * externe type bcrypt — plus simple à déployer sur Vercel).
 * Format stocké : "<salt_hex>:<hash_hex>".
 */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
