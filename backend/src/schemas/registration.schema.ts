import { z } from 'zod';

export const createRegistrationSchema = z.object({
  participantName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  participantEmail: z.string().trim().email('A valid email is required').max(200),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const cancelRegistrationSchema = z.object({
  reason: z.string().trim().min(5, 'Please provide a reason of at least 5 characters').max(500),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;
