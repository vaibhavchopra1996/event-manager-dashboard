import { Request, Response } from 'express';
import { RegistrationModel } from '../models/registrationModel.js';

export const registrationController = {
  // POST /api/events/:id/register
  async registerParticipant(req: Request, res: Response): Promise<void> {
    try {
      const event_id = parseInt(String(req.params.id), 10);
      const { name, email } = req.body;

      if (isNaN(event_id) || !name || !email) {
        res.status(400).json({ error: 'Event ID, participant name, and email are required.' });
        return;
      }

      const newRegistration = await RegistrationModel.create({
        event_id,
        participant_name: name,
        participant_email: email
      });
      res.status(201).json(newRegistration);
    } catch (error) {
      console.error('Error in registerParticipant:', error);
      res.status(500).json({ error: 'Internal server error while processing registration.' });
    }
  },

  // GET /api/events/:id/participants
  async getParticipants(req: Request, res: Response): Promise<void> {
    try {
      const event_id = parseInt(String(req.params.id), 10);
      if (isNaN(event_id)) {
        res.status(400).json({ error: 'Invalid event ID.' });
        return;
      }

      const list = await RegistrationModel.getByEventId(event_id);
      res.status(200).json(list);
    } catch (error) {
      console.error('Error in getParticipants:', error);
      res.status(500).json({ error: 'Internal server error while fetching roster.' });
    }
  },

  // PATCH /api/registrations/:id/cancel
  async cancelRegistration(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { reason } = req.body;

      if (isNaN(id) || !reason) {
        res.status(400).json({ error: 'Registration ID and reason are required.' });
        return;
      }

      const handled = await RegistrationModel.cancel(id, reason);
      if (!handled) {
        res.status(404).json({ error: 'Active registration record not found.' });
        return;
      }

      res.status(200).json({ message: 'Registration successfully canceled.' });
    } catch (error) {
      console.error('Error in cancelRegistration:', error);
      res.status(500).json({ error: 'Internal server error while updating registration status.' });
    }
  }
};
