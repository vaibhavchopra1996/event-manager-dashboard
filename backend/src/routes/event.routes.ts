import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import * as registrationController from '../controllers/registration.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEventSchema, listEventsQuerySchema, updateEventSchema } from '../schemas/event.schema';
import { cancelRegistrationSchema, createRegistrationSchema } from '../schemas/registration.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', validate(listEventsQuerySchema, 'query'), asyncHandler(eventController.listEvents));
router.get('/:id', optionalAuth, asyncHandler(eventController.getEvent));
router.post('/', requireAuth, validate(createEventSchema), asyncHandler(eventController.createEvent));
router.put('/:id', requireAuth, validate(updateEventSchema), asyncHandler(eventController.updateEvent));
router.delete('/:id', requireAuth, asyncHandler(eventController.deleteEvent));

router.post(
  '/:id/registrations',
  validate(createRegistrationSchema),
  asyncHandler(registrationController.applyToEvent),
);
router.get('/:id/registrations', requireAuth, asyncHandler(registrationController.listParticipants));
router.patch(
  '/:id/registrations/:registrationId/cancel',
  requireAuth,
  validate(cancelRegistrationSchema),
  asyncHandler(registrationController.cancelParticipant),
);

export default router;
