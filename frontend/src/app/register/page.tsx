'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Alert, Button, Card, Field, Input } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { fieldErrors, registerFormSchema } from '@/lib/validation';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = registerFormSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await register(parsed.data.name, parsed.data.email, parsed.data.password);
      router.push('/dashboard');
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {formError ? <Alert>{formError}</Alert> : null}
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input id="name" name="name" autoComplete="name" />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters">
            <Input id="password" name="password" type="password" autoComplete="new-password" />
          </Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </Card>
      <p className="text-sm text-slate-600">
        Already registered?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
