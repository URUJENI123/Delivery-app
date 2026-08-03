import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Validation Error',
      message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      details: err.errors,
    });
  }

  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      error: err.name,
      message: err.message,
    });
  }

  // Unknown errors
  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    statusCode: 500,
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
}
