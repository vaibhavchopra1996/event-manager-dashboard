'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import type { Event } from '@/lib/types';
import { useAsyncData } from '@/lib/useAsyncData';
import { EventForm } from './EventForm';
import { RequireAuth } from './RequireAuth';
import { Alert, Card } from './ui';

export function EditEvent({ eventId }: { eventId: number }) {
  const fetcher = useCallback(() => api.getEvent(eventId), [eventId]);
  const { data: event, loading, error } = useAsyncData<Event>(fetcher, 'Could not load the event');

  return (
    <RequireAuth>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit event</h1>
        {error ? <Alert>{error}</Alert> : null}
        {loading ? <p className="text-sm text-slate-500">Loading event…</p> : null}
        {event ? (
          <Card>
            <EventForm event={event} />
          </Card>
        ) : null}
      </div>
    </RequireAuth>
  );
}
