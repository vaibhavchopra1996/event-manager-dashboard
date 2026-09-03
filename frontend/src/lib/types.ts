export interface Event {
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

export interface Registration {
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

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface EventFilters {
  search?: string;
  location?: string;
  from?: string;
  to?: string;
  sort?: 'date' | 'name' | 'created_at';
  order?: 'asc' | 'desc';
  ownerId?: number;
}
