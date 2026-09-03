'use client';

import { EventForm } from '@/components/EventForm';
import { RequireAuth } from '@/components/RequireAuth';
import { Card } from '@/components/ui';

export default function NewEventPage() {
  return (
    <RequireAuth>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create event</h1>
          <p className="mt-1 text-sm text-slate-600">You become the owner and can manage its participants.</p>
        </div>
        <Card>
          <EventForm />
        </Card>
      </div>
    </RequireAuth>
  );
}
