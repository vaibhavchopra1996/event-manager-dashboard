// const BASE_URL = 'http://localhost:5000/api';

const BASE_URL = 'https://onrender.com';

export interface Event {
  id?: number;
  name: string;
  description: string;
  date: string;
  location: string;
}

export const api = {
  // Fetch all events
  async getEvents(): Promise<Event[]> {
    const res = await fetch(`${BASE_URL}/events`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  // Create a new event
  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  // Delete an event by ID
  async deleteEvent(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/events/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete event');
  }
};
