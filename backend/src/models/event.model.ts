import { query, queryOne } from '../config/db';
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from '../schemas/event.schema';

export interface EventRow {
  id: number;
  name: string;
  description: string | null;
  date: string;
  location: string | null;
  owner_id: number | null;
  owner_name: string | null;
  participant_count: number;
  created_at: Date;
  updated_at: Date;
}

const SELECT_EVENT = `
  SELECT e.id,
         e.name,
         e.description,
         to_char(e.date, 'YYYY-MM-DD') AS date,
         e.location,
         e.owner_id,
         u.name AS owner_name,
         COALESCE(r.participant_count, 0)::int AS participant_count,
         e.created_at,
         e.updated_at
  FROM events e
  LEFT JOIN users u ON u.id = e.owner_id
  LEFT JOIN (
    SELECT event_id, COUNT(*) AS participant_count
    FROM registrations
    WHERE status = 'registered'
    GROUP BY event_id
  ) r ON r.event_id = e.id
`;

const SORT_COLUMNS: Record<NonNullable<ListEventsQuery['sort']>, string> = {
  date: 'e.date',
  name: 'e.name',
  created_at: 'e.created_at',
};

export async function findAll(filters: ListEventsQuery): Promise<EventRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(e.name ILIKE $${params.length} OR e.description ILIKE $${params.length})`);
  }
  if (filters.location) {
    params.push(`%${filters.location}%`);
    conditions.push(`e.location ILIKE $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`e.date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`e.date <= $${params.length}`);
  }
  if (filters.ownerId) {
    params.push(filters.ownerId);
    conditions.push(`e.owner_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortColumn = SORT_COLUMNS[filters.sort];
  const direction = filters.order === 'desc' ? 'DESC' : 'ASC';

  return query<EventRow>(`${SELECT_EVENT} ${where} ORDER BY ${sortColumn} ${direction}, e.id ASC`, params);
}

export async function findById(id: number): Promise<EventRow | null> {
  return queryOne<EventRow>(`${SELECT_EVENT} WHERE e.id = $1`, [id]);
}

export async function insert(input: CreateEventInput, ownerId: number): Promise<EventRow> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO events (name, description, date, location, owner_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [input.name, input.description || null, input.date, input.location || null, ownerId],
  );
  return (await findById(row!.id))!;
}

export async function update(id: number, input: UpdateEventInput): Promise<EventRow | null> {
  const assignments: string[] = [];
  const params: unknown[] = [];

  for (const field of ['name', 'description', 'date', 'location'] as const) {
    const value = input[field];
    if (value !== undefined) {
      params.push(field === 'name' || field === 'date' ? value : value || null);
      assignments.push(`${field} = $${params.length}`);
    }
  }
  if (assignments.length === 0) {
    return findById(id);
  }

  params.push(id);
  const updated = await queryOne<{ id: number }>(
    `UPDATE events SET ${assignments.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING id`,
    params,
  );
  return updated ? findById(updated.id) : null;
}

export async function remove(id: number): Promise<boolean> {
  const row = await queryOne<{ id: number }>('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
  return row !== null;
}
