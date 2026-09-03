'use client';

import { useCallback, useState } from 'react';
import { ApiError, api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Registration } from '@/lib/types';
import { useAsyncData } from '@/lib/useAsyncData';
import { cancelFormSchema, fieldErrors } from '@/lib/validation';
import { Alert, Badge, Button, Card, Field, Input } from './ui';

interface ParticipantsTableProps {
  eventId: number;
  onChange?: () => void | Promise<void>;
}

export function ParticipantsTable({ eventId, onChange }: ParticipantsTableProps) {
  const fetcher = useCallback(() => api.listParticipants(eventId), [eventId]);
  const { data, loading, error, setData, setError } = useAsyncData<Registration[]>(
    fetcher,
    'Could not load participants',
  );
  const [cancelling, setCancelling] = useState<Registration | null>(null);
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [reason, setReason] = useState('');

  const participants = data ?? [];

  function closeDialog(): void {
    setCancelling(null);
    setReason('');
    setReasonError(undefined);
  }

  async function confirmCancel(): Promise<void> {
    if (!cancelling) {
      return;
    }
    const parsed = cancelFormSchema.safeParse({ reason });
    if (!parsed.success) {
      setReasonError(fieldErrors(parsed.error).reason);
      return;
    }
    try {
      const updated = await api.cancelRegistration(eventId, cancelling.id, parsed.data.reason);
      setData((current) => (current ?? []).map((item) => (item.id === updated.id ? updated : item)));
      closeDialog();
      await onChange?.();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not cancel the registration');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading participants…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{error}</Alert> : null}

      {participants.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Nobody has applied yet.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {participants.map((participant) => (
            <li key={participant.id}>
              <Card className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{participant.participantName}</p>
                    <p className="text-xs text-slate-500">{participant.participantEmail}</p>
                    <p className="mt-1 text-xs text-slate-400">Applied {formatDateTime(participant.createdAt)}</p>
                  </div>
                  <Badge tone={participant.status === 'registered' ? 'green' : 'red'}>{participant.status}</Badge>
                </div>

                {participant.note ? <p className="text-sm text-slate-600">“{participant.note}”</p> : null}

                {participant.status === 'cancelled' ? (
                  <p className="text-xs text-red-600">Cancelled: {participant.cancellationReason}</p>
                ) : (
                  <div>
                    <Button variant="secondary" onClick={() => setCancelling(participant)}>
                      Cancel registration
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {cancelling ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-base font-semibold">Cancel {cancelling.participantName}’s registration</h3>
            <p className="mt-1 text-sm text-slate-600">The reason is stored with the registration.</p>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Reason" htmlFor="reason" error={reasonError}>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Venue capacity reached"
                />
              </Field>
              <div className="flex gap-2">
                <Button variant="danger" onClick={confirmCancel}>
                  Confirm cancellation
                </Button>
                <Button variant="secondary" onClick={closeDialog}>
                  Keep registration
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
