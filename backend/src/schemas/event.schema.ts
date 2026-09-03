import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use the YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Date is not a valid calendar date');

export const createEventSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  date: isoDate,
  location: z.string().trim().max(200).optional().or(z.literal('')),
});

export const updateEventSchema = createEventSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided',
);

export const listEventsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  location: z.string().trim().max(200).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  sort: z.enum(['date', 'name', 'created_at']).default('date'),
  order: z.enum(['asc', 'desc']).default('asc'),
  ownerId: z.coerce.number().int().positive().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
