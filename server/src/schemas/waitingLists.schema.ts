import { z } from 'zod';

/** Boundary validation — the domain assumes input past this point is clean. */

export const createListSchema = z.strictObject({
  name: z.string().trim().min(1).optional(),
  capacity: z.number().int().min(1).optional()
});

export const countSchema = z.strictObject({
  count: z.number().int().min(1)
});

export type CreateListInput = z.infer<typeof createListSchema>;
export type CountInput = z.infer<typeof countSchema>;
