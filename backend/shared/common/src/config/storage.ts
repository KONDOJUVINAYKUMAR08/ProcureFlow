import fs from 'fs';
import path from 'path';
import config from './secrets';

// Replaces the old S3 upload/download/delete helpers. Files live on a local
// Docker volume (UPLOADS_DIR, mounted at /data in containers) under the same
// key layout the app already used for S3 (e.g. "invoices/{id}/{file}.pdf",
// "contracts/{id}.pdf") — `key` below is exactly that relative path.

const resolveKeyPath = (key: string): string => {
  const safeKey = key.replace(/^\/+/, '');
  return path.join(config.uploadsDir, safeKey);
};

export const saveFile = async (buffer: Buffer, key: string): Promise<string> => {
  const filePath = resolveKeyPath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
  return key;
};

export const readFile = async (key: string): Promise<Buffer> => {
  return fs.promises.readFile(resolveKeyPath(key));
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    await fs.promises.unlink(resolveKeyPath(key));
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
};

export const fileExists = (key: string): boolean => {
  return fs.existsSync(resolveKeyPath(key));
};
