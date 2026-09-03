import { Router } from 'express';
import { eventController } from '../controllers/eventController.js';
import { registrationController } from '../controllers/registrationController.js';

const router = Router();

// --- Event Resource Operations ---
router.post('/events', eventController.createEvent);
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);
router.delete('/events/:id', eventController.deleteEvent);

// --- Registration Resource Operations ---
// Feature 4: Apply to event
router.post('/events/:id/register', registrationController.registerParticipant);

// Feature 5: See participants roster and cancel individual signups
router.get('/events/:id/participants', registrationController.getParticipants);
router.patch('/registrations/:id/cancel', registrationController.cancelRegistration);

export default router;
