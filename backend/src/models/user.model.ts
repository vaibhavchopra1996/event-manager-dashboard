import { queryOne } from '../config/db';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
}

export async function findById(id: number): Promise<Omit<UserRow, 'password_hash'> | null> {
  return queryOne<Omit<UserRow, 'password_hash'>>(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id],
  );
}

export async function insert(name: string, email: string, passwordHash: string): Promise<UserRow> {
  return (await queryOne<UserRow>(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, lower($2), $3)
     RETURNING *`,
    [name, email, passwordHash],
  ))!;
}
