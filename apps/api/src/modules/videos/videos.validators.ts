import { z } from "zod";
import { ContentStatus, Difficulty, VideoSource, VideoType } from "@prisma/client";

const imageUrl = z.string().refine(
  (v) => /^https?:\/\//.test(v) || /^\/uploads\//.test(v),
  "URL de imagem inválida"
);

const imageItem = z.object({
  url: imageUrl,
  tagIds: z.array(z.string()).max(20).default([]),
});

const audioItem = z.object({
  url: z.string().max(1000),
  title: z.string().max(200).optional(),
});

export const createVideoSchema = z.object({
  title: z.string().min(2, "Título obrigatório").max(200),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  videoType: z.nativeEnum(VideoType).default(VideoType.EMBED),
  videoUrl: z.string().url("URL do vídeo inválida"),
  durationSeconds: z.number().int().min(0).optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.BASICO),
  isFree: z.boolean().default(true),
  source: z.nativeEnum(VideoSource).default(VideoSource.FRONTODONTUS),
  author: z.string().max(120).optional(),
  institution: z.string().max(200).optional(),
  observations: z.string().max(5000).optional(),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  specialtyId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).max(20).default([]),
  caseStudyIds: z.array(z.string()).max(10).default([]),
  imageUrls: z.array(imageUrl).max(10).default([]),
  images: z.array(imageItem).max(5).default([]),
  audioUrl: z.string().max(1000).optional().nullable(),
  audioTitle: z.string().max(200).optional().nullable(),
  audioTagIds: z.array(z.string()).max(20).default([]),
  audios: z.array(audioItem).max(10).default([]),
  recordedUrl: z.string().max(1000).optional().nullable(),
  recordedTitle: z.string().max(200).optional().nullable(),
  recordedDate: z.string().max(20).optional().nullable(),
  recordedTime: z.string().max(20).optional().nullable(),
});

export const updateVideoSchema = createVideoSchema.partial();

export const videoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().max(200).optional(),
  specialty: z.string().optional(),
  tag: z.string().optional(),
  caseStudy: z.string().optional(),
  imageTag: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  isFree: z.enum(["true", "false"]).optional(),
  source: z.nativeEnum(VideoSource).optional(),
  sort: z.enum(["recent", "popular", "oldest"]).optional(),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoQueryInput = z.infer<typeof videoQuerySchema>;
