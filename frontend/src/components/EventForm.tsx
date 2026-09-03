'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, api, type EventPayload } from '@/lib/api';
import type { Event } from '@/lib/types';
import { eventFormSchema, fieldErrors } from '@/lib/validation';
import { Alert, Button, Field, Input, Textarea } from './ui';

interface EventFormProps {
  event?: Event;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    setFormError(null);

    const formData = new FormData(formEvent.currentTarget);
    const parsed = eventFormSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      date: formData.get('date'),
      location: formData.get('location'),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const payload: EventPayload = parsed.data;
      const saved = event ? await api.updateEvent(event.id, payload) : await api.createEvent(payload);
      router.push(`/events/${saved.id}`);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError('Unexpected error, please try again');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {formError ? <Alert>{formError}</Alert> : null}

      <Field label="Event name" htmlFor="name" error={errors.name}>
        <Input id="name" name="name" defaultValue={event?.name} placeholder="Next.js Meetup" />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={event?.description ?? ''}
          placeholder="What is this event about?"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" error={errors.date}>
          <Input id="date" name="date" type="date" defaultValue={event?.date} />
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location}>
          <Input id="location" name="location" defaultValue={event?.location ?? ''} placeholder="Bengaluru" />
        </Field>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : event ? 'Save changes' : 'Create event'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
