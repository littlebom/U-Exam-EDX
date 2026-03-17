import crypto from "crypto";

/**
 * AES-256-GCM Encryption for sensitive PII fields (e.g., nationalId)
 *
 * - Uses a 32-byte key derived from ENCRYPTION_KEY env variable via SHA-256
 * - Each encryption generates a unique random IV (12 bytes)
 * - Produces an auth tag (16 bytes) for tamper detection
 * - Output format: "iv:authTag:ciphertext" (hex-encoded)
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Please set it in your .env file."
    );
  }
  // Derive a consistent 32-byte key from the secret using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a plaintext string
 * @returns Encrypted string in format "iv:authTag:ciphertext" (hex)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * @param encryptedText Encrypted string in format "iv:authTag:ciphertext" (hex)
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string looks like an encrypted value (iv:authTag:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  // iv = 12 bytes = 24 hex chars, authTag = 16 bytes = 32 hex chars
  return parts[0].length === IV_LENGTH * 2 && parts[1].length === TAG_LENGTH * 2;
}

/**
 * Mask a national ID for display: "1234567890123" → "●●●●●●●●●0123"
 */
export function maskNationalId(nationalId: string): string {
  if (nationalId.length <= 4) return nationalId;
  return "●".repeat(nationalId.length - 4) + nationalId.slice(-4);
}
