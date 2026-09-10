import crypto from "node:crypto";

/**
 * Chiffrement des jetons TikTok stockés en base (section 6 du cahier des
 * charges : "jamais en clair"). AES-256-GCM avec une clé dérivée de
 * APP_SECRET (utilisé uniquement côté serveur Node — routes API, jamais
 * dans le middleware qui tourne en Edge runtime, voir src/lib/session.ts).
 *
 * Format stocké : "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */

function getKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error(
      "APP_SECRET manquant. Générez-en un avec `openssl rand -hex 32` et ajoutez-le à votre .env."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decrypt(stored: string): string {
  const key = getKey();
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Format de jeton chiffré invalide.");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
