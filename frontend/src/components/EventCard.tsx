'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { Event } from '@/lib/types';
import { Badge, Button, Card } from './ui';

interface EventCardProps {
  event: Event;
  canManage: boolean;
  onDelete: (event: Event) => void;
}

export function EventCard({ event, canManage, onDelete }: EventCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/events/${event.id}`} className="text-base font-semibold text-slate-900 hover:underline">
            {event.name}
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            #{event.id} · {formatDate(event.date)}
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        <Badge tone="neutral">{event.participantCount} going</Badge>
      </div>

      {event.description ? <p className="line-clamp-3 text-sm text-slate-600">{event.description}</p> : null}

      <div className="mt-1 flex items-center gap-2">
        <Link href={`/events/${event.id}`}>
          <Button variant="secondary">View & apply</Button>
        </Link>
        {canManage ? (
          <>
            <Link href={`/events/${event.id}/edit`}>
              <Button variant="ghost">Edit</Button>
            </Link>
            <Button variant="danger" onClick={() => onDelete(event)}>
              Delete
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
