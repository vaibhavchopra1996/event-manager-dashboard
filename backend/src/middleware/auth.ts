import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from '../utils/errors';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
}

function verify(token: string): AuthUser {
  const payload = jwt.verify(token, env.jwtSecret);
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw unauthorized('Invalid token');
  }
  return {
    id: Number(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
  };
}

/** Rejects the request when no valid bearer token is present. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (!token) {
    next(unauthorized());
    return;
  }
  try {
    req.user = verify(token);
    next();
  } catch {
    next(unauthorized('Session expired, please sign in again'));
  }
}

/** Attaches the user when a valid token is present, but never blocks the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = readToken(req);
  if (token) {
    try {
      req.user = verify(token);
    } catch {
      /* ignore invalid tokens on public routes */
    }
  }
  next();
}
