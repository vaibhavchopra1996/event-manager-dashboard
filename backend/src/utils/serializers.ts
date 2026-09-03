import type { EventRow } from '../models/event.model';
import type { RegistrationRow } from '../models/registration.model';

export interface EventDto {
  id: number;
  name: string;
  description: string | null;
  date: string;
  location: string | null;
  ownerId: number | null;
  ownerName: string | null;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationDto {
  id: number;
  eventId: number;
  participantName: string;
  participantEmail: string;
  note: string | null;
  status: 'registered' | 'cancelled';
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export function toEventDto(row: EventRow): EventDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    date: row.date,
    location: row.location,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    participantCount: row.participant_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function toRegistrationDto(row: RegistrationRow): RegistrationDto {
  return {
    id: row.id,
    eventId: row.event_id,
    participantName: row.participant_name,
    participantEmail: row.participant_email,
    note: row.note,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}
