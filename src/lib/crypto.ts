import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY no configurado");
  return Buffer.from(key, "hex");
}

/**
 * Encrypts a string with AES-256-GCM.
 * Returns "iv:tag:ciphertext" in hex, all joined by colons.
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a string previously encrypted with encrypt().
 */
export function decrypt(data: string): string {
  const key = getKey();
  const parts = data.split(":");
  if (parts.length !== 3) throw new Error("Formato de clave encriptada inválido");
  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Returns a masked version of the key for display:
 * Claude: sk-ant-...••••XXXX
 * GPT:    sk-...••••XXXX
 */
export function maskKey(provider: string, plainKey: string): string {
  const last4 = plainKey.slice(-4);
  if (provider === "claude") return `sk-ant-...••••${last4}`;
  return `sk-...••••${last4}`;
}
