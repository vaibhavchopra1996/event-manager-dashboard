'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { ApiError, api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Event } from '@/lib/types';
import { useAsyncData } from '@/lib/useAsyncData';
import { useAuth } from './AuthProvider';
import { ApplyForm } from './ApplyForm';
import { ParticipantsTable } from './ParticipantsTable';
import { Alert, Badge, Button, Card } from './ui';

export function EventDetail({ eventId }: { eventId: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const fetcher = useCallback(() => api.getEvent(eventId), [eventId]);
  const { data: event, loading, error, reload, setError } = useAsyncData<Event>(fetcher, 'Could not load the event');

  async function handleDelete(): Promise<void> {
    if (!event || !window.confirm(`Delete "${event.name}"?`)) {
      return;
    }
    try {
      await api.deleteEvent(event.id);
      router.push('/');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete the event');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading event…</p>;
  }
  if (!event) {
    return (
      <div className="flex flex-col gap-4">
        <Alert>{error ?? 'Event not found'}</Alert>
        <Link href="/" className="text-sm text-slate-600 underline">
          Back to all events
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === event.ownerId;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← All events
      </Link>

      {error ? <Alert>{error}</Alert> : null}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Event #{event.id} · {formatDate(event.date)}
              {event.location ? ` · ${event.location}` : ''}
              {event.ownerName ? ` · hosted by ${event.ownerName}` : ''}
            </p>
          </div>
          <Badge tone="green">{event.participantCount} registered</Badge>
        </div>

        {event.description ? (
          <p className="whitespace-pre-line text-sm text-slate-700">{event.description}</p>
        ) : (
          <p className="text-sm italic text-slate-400">No description provided.</p>
        )}

        {isOwner ? (
          <div className="flex gap-2">
            <Link href={`/events/${event.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>
              Delete event
            </Button>
          </div>
        ) : null}
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Apply to this event</h2>
          <Card>
            <ApplyForm eventId={event.id} onApplied={reload} />
          </Card>
        </div>

        {isOwner ? (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Participants</h2>
            <ParticipantsTable eventId={event.id} onChange={reload} />
          </div>
        ) : (
          <div>
            <h2 className="mb-3 text-lg font-semibold">Organizer view</h2>
            <Card>
              <p className="text-sm text-slate-600">
                Participants are only visible to the event owner. Sign in as the owner to manage registrations from
                the{' '}
                <Link href="/dashboard" className="underline">
                  dashboard
                </Link>
                .
              </p>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
