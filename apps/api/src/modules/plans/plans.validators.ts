import { z } from "zod";
import { BillingPeriod, PlanStatus } from "@prisma/client";

export const createPlanSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  billing: z.nativeEnum(BillingPeriod).default(BillingPeriod.MONTHLY),
  benefits: z.array(z.string()).max(50).default([]),
  status: z.nativeEnum(PlanStatus).default(PlanStatus.ACTIVE),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
