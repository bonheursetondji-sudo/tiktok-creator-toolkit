import crypto from "node:crypto";

/**
 * Vérification du mot de passe (section 6 : accès protégé même pour un
 * usage strictement personnel). Utilisé uniquement dans la route API de
 * login, qui tourne en Node runtime — jamais dans le middleware.
 */
export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error("APP_PASSWORD manquant dans .env — voir .env.example.");
  }
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
