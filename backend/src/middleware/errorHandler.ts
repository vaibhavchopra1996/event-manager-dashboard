import type { NextFunction, Request, Response } from 'express';
import { DatabaseError } from 'pg';
import { env } from '../config/env';
import { HttpError } from '../utils/errors';

interface ErrorBody {
  error: string;
  details?: unknown;
}

/** Maps well-known PostgreSQL error codes onto meaningful HTTP responses. */
function fromDatabaseError(error: DatabaseError): { status: number; body: ErrorBody } {
  switch (error.code) {
    case '23505':
      return { status: 409, body: { error: 'That record already exists' } };
    case '23503':
      return { status: 400, body: { error: 'Referenced record does not exist' } };
    case '23514':
      return { status: 400, body: { error: 'A value violates a database constraint' } };
    case '22P02':
      return { status: 400, body: { error: 'Malformed value in request' } };
    default:
      return { status: 503, body: { error: 'Database is unavailable, please retry shortly' } };
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Endpoint not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express identifies error handlers by arity
export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  if (error instanceof DatabaseError) {
    const { status, body } = fromDatabaseError(error);
    if (status >= 500) {
      console.error('Database error:', error);
    }
    res.status(status).json(body);
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: env.nodeEnv === 'production' ? undefined : String(error),
  });
}
