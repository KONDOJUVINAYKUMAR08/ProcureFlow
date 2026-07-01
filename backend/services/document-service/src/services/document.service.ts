import { prisma } from '../lib/prisma';
import { saveFile, deleteFile, config } from '@procurement/common';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.category) where.category = query.category;
    if (query.relatedId) where.relatedId = query.relatedId;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.document.count({ where }),
    ]);

    return { documents, total };
  }

  async uploadFile(
    file: Express.Multer.File,
    category: string,
    userId: string,
    relatedId?: string
  ) {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageKey = `${category}s/${fileName}`;

    await saveFile(file.buffer, storageKey);

    const document = await prisma.document.create({
      data: {
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        category: category as any,
        relatedId,
        uploadedBy: userId,
      },
    });

    return document;
  }

  async getDownloadUrl(id: string) {
    const document = await prisma.document.findUnique({ where: { id: id } });
    if (!document) throw new Error('Document not found');

    // No S3 presigned URLs without S3 — the frontend hits this same id via
    // an authenticated stream endpoint instead (see document.controller.ts).
    return { url: `/documents/${id}/file`, document };
  }

  async getFilePath(id: string) {
    const document = await prisma.document.findUnique({ where: { id: id } });
    if (!document) throw new Error('Document not found');
    return document;
  }

  async delete(id: string) {
    const document = await prisma.document.findUnique({ where: { id: id } });
    if (!document) throw new Error('Document not found');

    await deleteFile(document.storageKey);
    await prisma.document.delete({ where: { id: id } });

    return document;
  }
}

export default new DocumentService();
