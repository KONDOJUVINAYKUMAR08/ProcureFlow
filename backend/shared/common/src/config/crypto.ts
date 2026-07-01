import crypto from 'crypto';
import config from './secrets';

// Replaces the old KMS encrypt/decrypt (which itself fell back to a base64
// no-op when no KMS key was configured). This is real AES-256-GCM using a
// locally-held key — used for PAN/Aadhar/bank fields on Employee.

const ALGORITHM = 'aes-256-gcm';

const getKey = (): Buffer => {
  return crypto.createHash('sha256').update(config.encryptionKey).digest();
};

export const encryptField = async (plaintext: string): Promise<string> => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

export const decryptField = async (ciphertext: string): Promise<string> => {
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};
