import { z } from "zod";

export const createSpecialtySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateSpecialtySchema = createSpecialtySchema.partial();

export type CreateSpecialtyInput = z.infer<typeof createSpecialtySchema>;
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtySchema>;
