import { z } from "zod";

export const saveResourceSchema = z.object({
  videoId: z.string().min(1, "Vídeo obrigatório").optional(),
  caseStudyId: z.string().min(1, "Estudo de caso obrigatório").optional(),
  type: z.enum(["QUIZ", "FLASHCARDS", "QUESTIONARIO", "MIND_MAP", "INFOGRAPHIC", "RESUMO", "AUDIO_RESUMO", "TRANSCRICAO"]),
  title: z.string().min(1, "Título obrigatório").max(200),
  content: z.unknown(),
  audioUrl: z.string().max(1000).optional().nullable(),
});

export type SaveResourceInput = z.infer<typeof saveResourceSchema>;

export const generateResourceSchema = z
  .object({
    videoId: z.string().min(1, "Vídeo obrigatório").optional(),
    caseStudyId: z.string().min(1, "Estudo de caso obrigatório").optional(),
    type: z.enum(["QUIZ", "FLASHCARDS", "QUESTIONARIO", "MIND_MAP", "INFOGRAPHIC", "RESUMO"]).optional(),
    useTranscription: z.boolean().optional().default(false),
    generateAll: z.boolean().optional().default(false),
  })
  .refine((v) => Boolean(v.videoId) !== Boolean(v.caseStudyId), {
    message: "Informe apenas videoId ou caseStudyId",
  })
  .refine((v) => v.generateAll || Boolean(v.type), {
    message: "Informe o tipo ou use generateAll",
  });

export type GenerateResourceInput = z.infer<typeof generateResourceSchema>;

export const transcribeSchema = z
  .object({
    videoId: z.string().min(1, "Vídeo obrigatório").optional(),
    caseStudyId: z.string().min(1, "Estudo de caso obrigatório").optional(),
  })
  .refine((v) => Boolean(v.videoId) !== Boolean(v.caseStudyId), {
    message: "Informe videoId ou caseStudyId (um deles)",
  });

export type TranscribeInput = z.infer<typeof transcribeSchema>;

export const saveGeminiKeySchema = z.object({
  geminiApiKey: z.string().min(1, "Chave obrigatória").max(500),
});

export const voteSchema = z.object({
  value: z.number().int().min(-1).max(1).default(1),
});
