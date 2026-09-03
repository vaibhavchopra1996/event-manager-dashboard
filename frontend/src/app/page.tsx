'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EventCard } from '@/components/EventCard';
import { useAuth } from '@/components/AuthProvider';
import { Alert, Button, Card, EmptyState, Field, Input, Select } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import type { Event, EventFilters } from '@/lib/types';
import { useAsyncData } from '@/lib/useAsyncData';

const DEFAULT_FILTERS: EventFilters = { search: '', location: '', from: '', to: '', sort: 'date', order: 'asc' };
const DEBOUNCE_MS = 250;

export default function EventsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const timer = setTimeout(() => setAppliedFilters(filters), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetcher = useCallback(() => api.listEvents(appliedFilters), [appliedFilters]);
  const { data, loading, error, setData, setError } = useAsyncData<Event[]>(fetcher, 'Could not load events');
  const events = data ?? [];

  async function handleDelete(event: Event): Promise<void> {
    if (!window.confirm(`Delete "${event.name}"? This also removes its registrations.`)) {
      return;
    }
    try {
      await api.deleteEvent(event.id);
      setData((current) => (current ?? []).filter((item) => item.id !== event.id));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete the event');
    }
  }

  function update(patch: Partial<EventFilters>): void {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-slate-600">Browse upcoming events and apply in a couple of clicks.</p>
        </div>
        {user ? (
          <Link href="/events/new">
            <Button>New event</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="secondary">Sign in to create</Button>
          </Link>
        )}
      </div>

      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Search" htmlFor="search">
          <Input
            id="search"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Name or description"
          />
        </Field>
        <Field label="Location" htmlFor="location">
          <Input
            id="location"
            value={filters.location}
            onChange={(e) => update({ location: e.target.value })}
            placeholder="Remote"
          />
        </Field>
        <Field label="From" htmlFor="from">
          <Input id="from" type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
        </Field>
        <Field label="To" htmlFor="to">
          <Input id="to" type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
        </Field>
        <Field label="Sort" htmlFor="sort">
          <Select
            id="sort"
            value={`${filters.sort}:${filters.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split(':') as [EventFilters['sort'], EventFilters['order']];
              update({ sort, order });
            }}
          >
            <option value="date:asc">Date ↑</option>
            <option value="date:desc">Date ↓</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="created_at:desc">Recently added</option>
          </Select>
        </Field>
      </Card>

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading events…</p>
      ) : events.length === 0 ? (
        <EmptyState title="No events found" description="Try clearing the filters or create the first event." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canManage={user?.id === event.ownerId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
