import { query, queryOne } from '../config/db';
import type { CreateRegistrationInput } from '../schemas/registration.schema';

export interface RegistrationRow {
  id: number;
  event_id: number;
  participant_name: string;
  participant_email: string;
  note: string | null;
  status: 'registered' | 'cancelled';
  cancellation_reason: string | null;
  cancelled_at: Date | null;
  created_at: Date;
}

const SELECT_REGISTRATION = `
  SELECT id, event_id, participant_name, participant_email, note, status,
         cancellation_reason, cancelled_at, created_at
  FROM registrations
`;

export async function findByEventId(eventId: number): Promise<RegistrationRow[]> {
  return query<RegistrationRow>(
    `${SELECT_REGISTRATION} WHERE event_id = $1 ORDER BY created_at ASC`,
    [eventId],
  );
}

export async function findById(id: number): Promise<RegistrationRow | null> {
  return queryOne<RegistrationRow>(`${SELECT_REGISTRATION} WHERE id = $1`, [id]);
}

export async function findByEventAndEmail(eventId: number, email: string): Promise<RegistrationRow | null> {
  return queryOne<RegistrationRow>(
    `${SELECT_REGISTRATION} WHERE event_id = $1 AND lower(participant_email) = lower($2)`,
    [eventId, email],
  );
}

export async function insert(eventId: number, input: CreateRegistrationInput): Promise<RegistrationRow> {
  return (await queryOne<RegistrationRow>(
    `INSERT INTO registrations (event_id, participant_name, participant_email, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, event_id, participant_name, participant_email, note, status,
               cancellation_reason, cancelled_at, created_at`,
    [eventId, input.participantName, input.participantEmail.toLowerCase(), input.note || null],
  ))!;
}

export async function cancel(id: number, reason: string): Promise<RegistrationRow | null> {
  return queryOne<RegistrationRow>(
    `UPDATE registrations
     SET status = 'cancelled', cancellation_reason = $2, cancelled_at = now()
     WHERE id = $1 AND status = 'registered'
     RETURNING id, event_id, participant_name, participant_email, note, status,
               cancellation_reason, cancelled_at, created_at`,
    [id, reason],
  );
}

export async function reinstate(id: number, input: CreateRegistrationInput): Promise<RegistrationRow | null> {
  return queryOne<RegistrationRow>(
    `UPDATE registrations
     SET status = 'registered', participant_name = $2, note = $3,
         cancellation_reason = NULL, cancelled_at = NULL, created_at = now()
     WHERE id = $1
     RETURNING id, event_id, participant_name, participant_email, note, status,
               cancellation_reason, cancelled_at, created_at`,
    [id, input.participantName, input.note || null],
  );
}
