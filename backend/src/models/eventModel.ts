import pool from '../config/db.js';

export interface Event {
  id?: number;
  name: string;
  description: string;
  date: string;
  location: string;
}

export const EventModel = {
  // 1. Create a new event
  async create(event: Event): Promise<Event> {
    const { name, description, date, location } = event;
    const query = `
      INSERT INTO events (name, description, date, location)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [name, description, date, location];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // 2. Fetch all events
  async getAll(): Promise<Event[]> {
    const query = 'SELECT * FROM events ORDER BY date ASC;';
    const { rows } = await pool.query(query);
    return rows;
  },

  // 3. Delete event by ID
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM events WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows.length > 0;
  },

  // 4. Fetch Event Details by ID (Required for feature 4)
  async getById(id: number): Promise<Event | null> {
    const query = 'SELECT * FROM events WHERE id = $1;';
    const { rows } = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }
};
