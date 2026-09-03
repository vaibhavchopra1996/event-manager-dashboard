import { Request, Response } from 'express';
import { EventModel } from '../models/eventModel.js';

export const eventController = {
  // 1. Create a new event
  async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, date, location } = req.body;
      
      // Simple validation check
      if (!name || !date) {
        res.status(400).json({ error: 'Name and date are required fields.' });
        return;
      }

      const newEvent = await EventModel.create({ name, description, date, location });
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Internal server error while creating event.' });
    }
  },

  // 2. Fetch all events
  async getAllEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await EventModel.getAll();
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Internal server error while fetching events.' });
    }
  },

  // 3. Delete event by ID
  async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid event ID.' });
        return;
      }

      const deleted = await EventModel.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      res.status(200).json({ message: 'Event successfully deleted.' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Internal server error while deleting event.' });
    }
  },

  // 4. Fetch Event Details by ID
  async getEventById(req: Request, res: Response): Promise<void> {
    try {
const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid event ID.' });
        return;
      }

      const event = await EventModel.getById(id);
      if (!event) {
        res.status(404).json({ error: 'Event not found.' });
        return;
      }

      res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event details:', error);
      res.status(500).json({ error: 'Internal server error while fetching event details.' });
    }
  }
};
