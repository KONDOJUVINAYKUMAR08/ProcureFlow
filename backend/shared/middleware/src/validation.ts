import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.query = value;
    next();
  };
};
