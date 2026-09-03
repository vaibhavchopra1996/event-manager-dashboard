'use client';

import { useState, type FormEvent } from 'react';
import { ApiError, api } from '@/lib/api';
import { applyFormSchema, fieldErrors } from '@/lib/validation';
import { Alert, Button, Field, Input, Textarea } from './ui';

interface ApplyFormProps {
  eventId: number;
  onApplied: () => void | Promise<void>;
}

export function ApplyForm({ eventId, onApplied }: ApplyFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = applyFormSchema.safeParse({
      participantName: formData.get('participantName'),
      participantEmail: formData.get('participantEmail'),
      note: formData.get('note'),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await api.applyToEvent(eventId, parsed.data);
      form.reset();
      setSuccess('You are registered. See you there!');
      await onApplied();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setErrors(caught.fieldErrors);
        setFormError(caught.message);
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
      {success ? <Alert tone="success">{success}</Alert> : null}

      <Field label="Your name" htmlFor="participantName" error={errors.participantName}>
        <Input id="participantName" name="participantName" placeholder="Asha Rao" />
      </Field>
      <Field label="Email" htmlFor="participantEmail" error={errors.participantEmail}>
        <Input id="participantEmail" name="participantEmail" type="email" placeholder="asha@example.com" />
      </Field>
      <Field label="Note (optional)" htmlFor="note" error={errors.note}>
        <Textarea id="note" name="note" rows={3} placeholder="Anything the organizer should know?" />
      </Field>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Applying…' : 'Apply'}
      </Button>
    </form>
  );
}
