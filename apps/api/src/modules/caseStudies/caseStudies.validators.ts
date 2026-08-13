import { z } from "zod";
import { ContentStatus, Difficulty } from "@prisma/client";

const imageUrl = z.string().refine(
  (v) => /^https?:\/\//.test(v) || /^\/uploads\//.test(v),
  "URL de imagem inválida"
);

const imageItem = z.object({
  url: imageUrl,
  tagIds: z.array(z.string()).max(20).default([]),
});

export const createCaseStudySchema = z.object({
  title: z.string().min(2, "Título obrigatório").max(200),
  description: z.string().max(5000).optional(),
  diagnosis: z.string().max(2000).optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.BASICO),
  isFree: z.boolean().default(false),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  author: z.string().max(120).optional(),
  institution: z.string().max(200).optional(),
  specialtyId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).max(20).default([]),
  videoIds: z.array(z.string()).max(20).default([]),
  relatedIds: z.array(z.string()).max(10).default([]),
  observations: z.string().max(5000).optional().nullable(),
  imageUrls: z.array(imageUrl).max(10).default([]),
  images: z.array(imageItem).max(5).default([]),
});

export const updateCaseStudySchema = createCaseStudySchema.partial();

export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;
export type UpdateCaseStudyInput = z.infer<typeof updateCaseStudySchema>;
