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

  // Unknown / unexpected errors — expose what we actually know
  const isDev = process.env.NODE_ENV !== 'production';
  const isError = err instanceof Error;
  const errorName  = isError ? err.name    : 'UnknownError';
  const errorMsg   = isError ? err.message : String(err);
  const errorStack = isError ? err.stack   : undefined;

  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    statusCode: 500,
    error: errorName,
    message: errorMsg,
    // Full stack trace in dev; omitted in production
    ...(isDev && { stack: errorStack }),
  });
}
