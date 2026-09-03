'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ParticipantsTable } from '@/components/ParticipantsTable';
import { RequireAuth } from '@/components/RequireAuth';
import { Alert, Badge, Button, Card, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Event } from '@/lib/types';
import { useAsyncData } from '@/lib/useAsyncData';

function OwnerDashboard() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetcher = useCallback(
    () => api.listEvents({ ownerId: user?.id, sort: 'date', order: 'asc' }),
    [user?.id],
  );
  const { data, loading, error, reload } = useAsyncData<Event[]>(fetcher, 'Could not load your events');

  const events = data ?? [];
  const selected = events.find((event) => event.id === selectedId) ?? events[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your events and their participants. Cancel a registration with a reason when needed.
          </p>
        </div>
        <Link href="/events/new">
          <Button>New event</Button>
        </Link>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading your events…</p>
      ) : events.length === 0 ? (
        <EmptyState title="You have no events yet" description="Create your first event to start collecting applications." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <button key={event.id} type="button" onClick={() => setSelectedId(event.id)} className="text-left">
                <Card
                  className={`transition-colors ${
                    event.id === selected?.id ? 'border-slate-900' : 'hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{event.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(event.date)}
                        {event.location ? ` · ${event.location}` : ''}
                      </p>
                    </div>
                    <Badge>{event.participantCount}</Badge>
                  </div>
                </Card>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {selected ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Participants · {selected.name}</h2>
                  <Link href={`/events/${selected.id}`} className="text-sm text-slate-600 underline">
                    Open event
                  </Link>
                </div>
                <ParticipantsTable key={selected.id} eventId={selected.id} onChange={reload} />
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <OwnerDashboard />
    </RequireAuth>
  );
}
