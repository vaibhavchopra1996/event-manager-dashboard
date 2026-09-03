import type { Event, EventFilters, Registration, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'event-manager-token';

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStore = {
  get: (): string | null => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (token: string): void => window.localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => window.localStorage.removeItem(TOKEN_KEY),
};

interface ApiErrorBody {
  error?: string;
  details?: Record<string, string>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Is the backend running?');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody & { data?: T };
  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? 'Something went wrong', body.details ?? {});
  }
  return body.data as T;
}

function toQueryString(filters: EventFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export interface EventPayload {
  name: string;
  description?: string;
  date: string;
  location?: string;
}

export interface ApplyPayload {
  participantName: string;
  participantEmail: string;
  note?: string;
}

export const api = {
  listEvents: (filters: EventFilters = {}) => request<Event[]>(`/api/events${toQueryString(filters)}`),
  getEvent: (id: number) => request<Event>(`/api/events/${id}`),
  createEvent: (payload: EventPayload) =>
    request<Event>('/api/events', { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (id: number, payload: EventPayload) =>
    request<Event>(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEvent: (id: number) => request<void>(`/api/events/${id}`, { method: 'DELETE' }),

  applyToEvent: (id: number, payload: ApplyPayload) =>
    request<Registration>(`/api/events/${id}/registrations`, { method: 'POST', body: JSON.stringify(payload) }),
  listParticipants: (id: number) => request<Registration[]>(`/api/events/${id}/registrations`),
  cancelRegistration: (eventId: number, registrationId: number, reason: string) =>
    request<Registration>(`/api/events/${eventId}/registrations/${registrationId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  register: (payload: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request<{ user: User }>('/api/auth/me'),
};
