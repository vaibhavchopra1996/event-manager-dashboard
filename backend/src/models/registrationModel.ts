import pool from '../config/db.js';

export interface Registration {
  id?: number;
  event_id: number;
  participant_name: string;
  participant_email: string;
  status?: string;
  cancellation_reason?: string | null;
}

export const RegistrationModel = {
  // Save a participant registration
  async create(registration: Registration): Promise<Registration> {
    const { event_id, participant_name, participant_email } = registration;
    const query = `
      INSERT INTO registrations (event_id, participant_name, participant_email)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [event_id, participant_name, participant_email]);
    return rows[0];
  },

  // Get all registrations for a specific event
  async getByEventId(eventId: number): Promise<Registration[]> {
    const query = 'SELECT * FROM registrations WHERE event_id = $1 ORDER BY id DESC;';
    const { rows } = await pool.query(query, [eventId]);
    return rows;
  },

  // Cancel an active registration with a reason
  async cancel(id: number, reason: string): Promise<boolean> {
    const query = `
      UPDATE registrations 
      SET status = 'canceled', cancellation_reason = $2 
      WHERE id = $1 AND status = 'active'
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, reason]);
    return rows.length > 0;
  }
};
