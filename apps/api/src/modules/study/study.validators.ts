import { z } from "zod";

export const saveResourceSchema = z.object({
  videoId: z.string().min(1, "Vídeo obrigatório"),
  type: z.enum(["QUIZ", "FLASHCARDS", "QUESTIONARIO", "MIND_MAP", "INFOGRAPHIC", "RESUMO", "AUDIO_RESUMO"]),
  title: z.string().min(1, "Título obrigatório").max(200),
  content: z.unknown(),
  audioUrl: z.string().max(1000).optional().nullable(),
});

export type SaveResourceInput = z.infer<typeof saveResourceSchema>;

export const generateResourceSchema = z.object({
  videoId: z.string().min(1, "Vídeo obrigatório"),
  type: z.enum(["QUIZ", "FLASHCARDS", "QUESTIONARIO", "MIND_MAP", "INFOGRAPHIC", "RESUMO"]),
});

export type GenerateResourceInput = z.infer<typeof generateResourceSchema>;

export const saveGeminiKeySchema = z.object({
  geminiApiKey: z.string().min(1, "Chave obrigatória").max(500),
});

export const voteSchema = z.object({
  value: z.number().int().min(-1).max(1).default(1),
});