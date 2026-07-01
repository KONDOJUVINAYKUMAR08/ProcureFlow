import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import documentService from '../services/document.service';
import { sendSuccess, sendError, paginate } from '@procurement/utils';
import { readFile } from '@procurement/common';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and Images are allowed.'));
    }
  },
});

export const uploadMiddleware: import('express').RequestHandler = upload.single('file');

export class DocumentController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const { page, limit, skip } = paginate(
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      
      const { documents, total } = await documentService.findAll(req.query, skip, limit);
      
      return sendSuccess(res, {
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async upload(req: IAuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 'No file provided', 400);
      }

      const { category, relatedId } = req.body;
      if (!category) {
        return sendError(res, 'Document category is required', 400);
      }

      const document = await documentService.uploadFile(
        req.file,
        category,
        req.user!.userId,
        relatedId
      );

      return sendSuccess(res, document, 'File uploaded successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getDownloadUrl(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await documentService.getDownloadUrl(req.params.id);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  // Streams the file from local storage — replaces the old S3 presigned URL.
  async getFile(req: IAuthenticatedRequest, res: Response) {
    try {
      const document = await documentService.getFilePath(req.params.id);
      const buffer = await readFile(document.storageKey);
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      return res.send(buffer);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      await documentService.delete(req.params.id);
      return sendSuccess(res, null, 'Document deleted successfully');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new DocumentController();
