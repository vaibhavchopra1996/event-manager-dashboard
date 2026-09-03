import type { Request, Response } from 'express';
import * as eventModel from '../models/event.model';
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from '../schemas/event.schema';
import { badRequest, forbidden, notFound, unauthorized } from '../utils/errors';
import { toEventDto } from '../utils/serializers';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest('Event id must be a positive integer');
  }
  return id;
}

export async function listEvents(req: Request, res: Response): Promise<void> {
  const rows = await eventModel.findAll(req.query as unknown as ListEventsQuery);
  res.json({ data: rows.map(toEventDto) });
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  const row = await eventModel.findById(parseId(req.params.id));
  if (!row) {
    throw notFound('Event not found');
  }
  res.json({ data: toEventDto(row) });
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw unauthorized();
  }
  const row = await eventModel.insert(req.body as CreateEventInput, req.user.id);
  res.status(201).json({ data: toEventDto(row) });
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw notFound('Event not found');
  }
  if (existing.owner_id !== req.user?.id) {
    throw forbidden('Only the event owner can update this event');
  }
  const row = await eventModel.update(id, req.body as UpdateEventInput);
  res.json({ data: toEventDto(row!) });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const existing = await eventModel.findById(id);
  if (!existing) {
    throw notFound('Event not found');
  }
  if (existing.owner_id !== req.user?.id) {
    throw forbidden('Only the event owner can delete this event');
  }
  await eventModel.remove(id);
  res.status(204).send();
}
