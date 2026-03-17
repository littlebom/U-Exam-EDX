import { describe, it, expect, vi, beforeEach } from "vitest";

// Set ENCRYPTION_KEY before importing
vi.stubEnv("ENCRYPTION_KEY", "test-encryption-key-for-vitest");

const { encrypt, decrypt, isEncrypted, maskNationalId } = await import("./encryption");

describe("encryption", () => {
  describe("encrypt / decrypt", () => {
    it("should encrypt and decrypt a string correctly", () => {
      const plaintext = "1234567890123";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext each time (random IV)", () => {
      const plaintext = "1234567890123";
      const enc1 = encrypt(plaintext);
      const enc2 = encrypt(plaintext);
      expect(enc1).not.toBe(enc2);
    });

    it("should produce format iv:authTag:ciphertext", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(24); // 12 bytes = 24 hex
      expect(parts[1]).toHaveLength(32); // 16 bytes = 32 hex
    });
  });

  describe("isEncrypted", () => {
    it("should return true for encrypted values", () => {
      const encrypted = encrypt("test");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for plain text", () => {
      expect(isEncrypted("1234567890123")).toBe(false);
      expect(isEncrypted("hello")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isEncrypted("")).toBe(false);
    });
  });

  describe("maskNationalId", () => {
    it("should mask all but last 4 digits", () => {
      expect(maskNationalId("1234567890123")).toBe("●●●●●●●●●0123");
    });

    it("should handle short IDs", () => {
      expect(maskNationalId("1234")).toBe("1234");
      expect(maskNationalId("12345")).toBe("●2345");
    });
  });
});
