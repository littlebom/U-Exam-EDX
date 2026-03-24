import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "";
  // Pad/truncate to 32 bytes for AES-256
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
}

/**
 * Encrypt a string value. Returns "enc:iv:tag:ciphertext" format.
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a string value. Expects "enc:iv:tag:ciphertext" format.
 * Returns plaintext. If input is not encrypted (no "enc:" prefix), returns as-is.
 */
export function decryptSecret(encrypted: string): string {
  if (!encrypted.startsWith("enc:")) {
    // Not encrypted — return as-is (backward compatibility)
    return encrypted;
  }

  const parts = encrypted.split(":");
  if (parts.length !== 4) return encrypted;

  const [, ivHex, tagHex, ciphertext] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a value is already encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith("enc:");
}
