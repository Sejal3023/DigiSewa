import crypto from "node:crypto";

export const sha256Hex = (contentBufferOrString) => {
  const hash = crypto.createHash("sha256");
  hash.update(contentBufferOrString);
  return hash.digest("hex");
};

// AES-256-GCM encryption/decryption helpers
const ALGO = "aes-256-gcm";

export const aesEncrypt = (plaintextBuffer, key32Bytes) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key32Bytes, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { iv: iv.toString("hex"), authTag: authTag.toString("hex"), ciphertext: ciphertext.toString("base64") };
};

export const aesDecrypt = (ciphertextB64, key32Bytes, ivHex, authTagHex) => {
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, key32Bytes, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()]);
  return plaintext;
};

export const deriveAesKeyFromSecret = (secret) => {
  // Derive a stable 32-byte key using SHA-256 of secret
  return crypto.createHash("sha256").update(secret).digest();
};


