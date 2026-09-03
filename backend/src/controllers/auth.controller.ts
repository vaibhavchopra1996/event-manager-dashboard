import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import * as userModel from '../models/user.model';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { conflict, unauthorized } from '../utils/errors';

interface PublicUser {
  id: number;
  name: string;
  email: string;
}

function issueToken(user: PublicUser): string {
  return jwt.sign({ email: user.email, name: user.name }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as RegisterInput;
  if (await userModel.findByEmail(email)) {
    throw conflict('An account with this email already exists');
  }
  const created = await userModel.insert(name, email, await bcrypt.hash(password, 10));
  const user: PublicUser = { id: created.id, name: created.name, email: created.email };
  res.status(201).json({ data: { user, token: issueToken(user) } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;
  const found = await userModel.findByEmail(email);
  if (!found || !(await bcrypt.compare(password, found.password_hash))) {
    throw unauthorized('Invalid email or password');
  }
  const user: PublicUser = { id: found.id, name: found.name, email: found.email };
  res.json({ data: { user, token: issueToken(user) } });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await userModel.findById(req.user!.id);
  if (!user) {
    throw unauthorized();
  }
  res.json({ data: { user: { id: user.id, name: user.name, email: user.email } } });
}
