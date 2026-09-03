import type { Request, Response } from 'express';
import * as eventModel from '../models/event.model';
import * as registrationModel from '../models/registration.model';
import type { CancelRegistrationInput, CreateRegistrationInput } from '../schemas/registration.schema';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors';
import { toRegistrationDto } from '../utils/serializers';

function parseId(raw: string, label: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`${label} must be a positive integer`);
  }
  return id;
}

async function loadOwnedEvent(req: Request): Promise<{ eventId: number }> {
  const eventId = parseId(req.params.id, 'Event id');
  const event = await eventModel.findById(eventId);
  if (!event) {
    throw notFound('Event not found');
  }
  if (event.owner_id !== req.user?.id) {
    throw forbidden('Only the event owner can manage participants');
  }
  return { eventId };
}

/** Public: anyone can apply to an event. */
export async function applyToEvent(req: Request, res: Response): Promise<void> {
  const eventId = parseId(req.params.id, 'Event id');
  const event = await eventModel.findById(eventId);
  if (!event) {
    throw notFound('Event not found');
  }

  const input = req.body as CreateRegistrationInput;
  const existing = await registrationModel.findByEventAndEmail(eventId, input.participantEmail);
  if (existing?.status === 'registered') {
    throw conflict('This email is already registered for the event');
  }
  const row = existing
    ? await registrationModel.reinstate(existing.id, input)
    : await registrationModel.insert(eventId, input);

  res.status(201).json({ data: toRegistrationDto(row!) });
}

export async function listParticipants(req: Request, res: Response): Promise<void> {
  const { eventId } = await loadOwnedEvent(req);
  const rows = await registrationModel.findByEventId(eventId);
  res.json({ data: rows.map(toRegistrationDto) });
}

export async function cancelParticipant(req: Request, res: Response): Promise<void> {
  const { eventId } = await loadOwnedEvent(req);
  const registrationId = parseId(req.params.registrationId, 'Registration id');

  const registration = await registrationModel.findById(registrationId);
  if (!registration || registration.event_id !== eventId) {
    throw notFound('Registration not found for this event');
  }
  if (registration.status === 'cancelled') {
    throw conflict('This registration is already cancelled');
  }

  const row = await registrationModel.cancel(registrationId, (req.body as CancelRegistrationInput).reason);
  res.json({ data: toRegistrationDto(row!) });
}
