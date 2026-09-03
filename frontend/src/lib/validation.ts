import { z } from 'zod';

export const eventFormSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please pick a valid date'),
  location: z.string().trim().max(200).optional().or(z.literal('')),
});

export const applyFormSchema = z.object({
  participantName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  participantEmail: z.string().trim().email('A valid email is required'),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const cancelFormSchema = z.object({
  reason: z.string().trim().min(5, 'Please explain the cancellation in at least 5 characters').max(500),
});

export const loginFormSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerFormSchema = loginFormSchema.extend({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Flattens a Zod error into a `field -> message` map for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join('.') || 'root', issue.message]));
}
