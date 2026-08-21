import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { NotFoundError, ConflictError, BadRequestError } from "../../utils/errors.js";
import type { Prisma } from "@prisma/client";
import type { SaveResourceInput, GenerateResourceInput } from "./study.validators.js";

const ALGO = "aes-256-gcm";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-3.6-flash";
const GENERATABLE_TYPES = ["QUIZ", "FLASHCARDS", "QUESTIONARIO", "MIND_MAP", "INFOGRAPHIC", "RESUMO"] as const;
type GeneratableType = (typeof GENERATABLE_TYPES)[number];

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/;

function toWatchUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_ID_REGEX) ?? url.match(/^([\w-]{11})$/);
  if (!match) return null;
  return `https://www.youtube.com/watch?v=${match[1]}`;
}

function encryptionKey(): Buffer {
  const key = env.encryptionKey || env.jwtSecret;
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptApiKey(key: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptApiKey(encrypted: string): string {
  const [ivB64, tagB64, dataB64] = encrypted.split(".");
  const decipher = crypto.createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export async function saveGeminiKey(userId: string, geminiApiKey: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { geminiApiKey: encryptApiKey(geminiApiKey.trim()) },
  });
  return { saved: true };
}

export async function getMyGeminiKey(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });
  return { hasKey: Boolean(user?.geminiApiKey) };
}

export async function saveResource(userId: string, input: SaveResourceInput) {
  if (input.videoId) {
    const video = await prisma.video.findUnique({ where: { id: input.videoId }, select: { id: true } });
    if (!video) throw new NotFoundError("Vídeo não encontrado");
  }
  if (input.caseStudyId) {
    const cs = await prisma.caseStudy.findUnique({ where: { id: input.caseStudyId }, select: { id: true } });
    if (!cs) throw new NotFoundError("Estudo de caso não encontrado");
  }

  return prisma.studyResource.create({
    data: {
      videoId: input.videoId ?? null,
      caseStudyId: input.caseStudyId ?? null,
      authorId: userId,
      type: input.type,
      title: input.title,
      content: input.content as Prisma.InputJsonValue,
      audioUrl: input.audioUrl ?? null,
      status: "RASCUNHO",
    },
    select: { id: true, type: true, status: true, title: true, audioUrl: true, createdAt: true },
  });
}

export async function listMyResources(userId: string) {
  return prisma.studyResource.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      audioUrl: true,
      createdAt: true,
      updatedAt: true,
      video: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
      caseStudy: { select: { id: true, title: true, slug: true } },
      _count: { select: { votes: true } },
    },
  });
}

const resourceSelect = {
  id: true,
  type: true,
  status: true,
  title: true,
  content: true,
  audioUrl: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
  _count: { select: { votes: true } },
} as const;

export async function listVideoResources(userId: string, videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
  if (!video) throw new NotFoundError("Vídeo não encontrado");

  const resources = await prisma.studyResource.findMany({
    where: { videoId, OR: [{ status: "PUBLICADO" }, { authorId: userId }] },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    select: resourceSelect,
  });

  return resources.map((r) => ({
    ...r,
    mine: r.author.id === userId,
    votes: r._count.votes,
    _count: undefined,
  }));
}

export async function listCaseResources(userId: string, caseStudyId: string) {
  const cs = await prisma.caseStudy.findUnique({ where: { id: caseStudyId }, select: { id: true } });
  if (!cs) throw new NotFoundError("Estudo de caso não encontrado");

  const resources = await prisma.studyResource.findMany({
    where: { caseStudyId, OR: [{ status: "PUBLICADO" }, { authorId: userId }] },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    select: resourceSelect,
  });

  return resources.map((r) => ({
    ...r,
    mine: r.author.id === userId,
    votes: r._count.votes,
    _count: undefined,
  }));
}

export async function getResource(userId: string, resourceId: string) {
  const resource = await prisma.studyResource.findUnique({
    where: { id: resourceId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      video: { select: { id: true, title: true, slug: true } },
    },
  });
  if (!resource) throw new NotFoundError("Recurso de estudo não encontrado");
  if (resource.status !== "PUBLICADO" && resource.authorId !== userId) {
    throw new NotFoundError("Recurso de estudo não encontrado");
  }
  return resource;
}

export async function submitToLibrary(userId: string, resourceId: string) {
  const resource = await prisma.studyResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new NotFoundError("Recurso de estudo não encontrado");
  if (resource.authorId !== userId) throw new ConflictError("Você só pode enviar seus próprios recursos");

  return prisma.studyResource.update({
    where: { id: resourceId },
    data: { status: "EM_REVISAO" },
    select: { id: true, status: true },
  });
}

export async function deleteResource(userId: string, resourceId: string) {
  const resource = await prisma.studyResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new NotFoundError("Recurso de estudo não encontrado");
  if (resource.authorId !== userId) throw new ConflictError("Você só pode excluir seus próprios recursos");

  await prisma.studyResource.delete({ where: { id: resourceId } });
  return { deleted: true };
}

export async function voteResource(userId: string, resourceId: string, value: number) {
  const resource = await prisma.studyResource.findUnique({
    where: { id: resourceId },
    select: { id: true, status: true },
  });
  if (!resource) throw new NotFoundError("Recurso de estudo não encontrado");
  if (resource.status !== "PUBLICADO") throw new ConflictError("Só é possível avaliar recursos publicados");

  await prisma.studyVote.upsert({
    where: { resourceId_userId: { resourceId, userId } },
    update: { value },
    create: { resourceId, userId, value },
  });

  return { ok: true };
}

type StudyContext = {
  type: "video" | "case";
  id: string;
  titulo: string;
  descricao: string;
  observacoes: string;
  especialidade: string;
  tags: string;
  casosRelacionados: string[];
  mediaUrl: string | null;
};

async function buildVideoContext(videoId: string): Promise<StudyContext> {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      title: true,
      description: true,
      observations: true,
      videoUrl: true,
      specialty: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
      caseStudies: {
        select: {
          caseStudy: { select: { title: true, description: true, diagnosis: true, observations: true } },
        },
      },
    },
  });
  if (!video) throw new NotFoundError("Vídeo não encontrado");

  return {
    type: "video",
    id: videoId,
    titulo: video.title,
    descricao: video.description ?? "",
    observacoes: video.observations ?? "",
    especialidade: video.specialty?.name ?? "",
    tags: video.tags.map((t) => t.tag.name).join(", "),
    casosRelacionados: video.caseStudies.map(
      (c) => `${c.caseStudy.title}: ${c.caseStudy.description ?? ""} ${c.caseStudy.diagnosis ?? ""}`
    ),
    mediaUrl: video.videoUrl ?? null,
  };
}

async function buildCaseContext(caseStudyId: string): Promise<StudyContext> {
  const cs = await prisma.caseStudy.findUnique({
    where: { id: caseStudyId },
    select: {
      title: true,
      description: true,
      diagnosis: true,
      observations: true,
      audioUrl: true,
      audioTitle: true,
      specialty: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });
  if (!cs) throw new NotFoundError("Estudo de caso não encontrado");

  return {
    type: "case",
    id: caseStudyId,
    titulo: cs.title,
    descricao: cs.description ?? "",
    observacoes: cs.observations ?? "",
    especialidade: cs.specialty?.name ?? "",
    tags: cs.tags.map((t) => t.tag.name).join(", "),
    casosRelacionados: cs.diagnosis ? [`Diagnóstico: ${cs.diagnosis}`] : [],
    mediaUrl: cs.audioUrl ?? null,
  };
}

const PROMPTS: Record<string, string> = {
  QUIZ: "Gere um quiz com 10 perguntas de múltipla escolha (4 alternativas cada), com a alternativa correta indicada e uma breve explicação para cada questão. Responda em JSON com formato {\"questions\":[{\"question\":\"\",\"options\":[\"a\",\"b\",\"c\",\"d\"],\"correctIndex\":0,\"explanation\":\"\"}]}",
  FLASHCARDS: "Gere 15 flashcards de revisão (pergunta/resposta) sobre o conteúdo. Responda em JSON com formato {\"cards\":[{\"front\":\"\",\"back\":\"\"}]}",
  QUESTIONARIO: "Gere um questionário de estudo com 10 perguntas abertas e um gabarito objetivo para cada uma. Responda em JSON com formato {\"questions\":[{\"question\":\"\",\"answer\":\"\"}]}",
  MIND_MAP: "Gere um mapa mental hierárquico do conteúdo. Responda em JSON com formato {\"title\":\"\",\"nodes\":[{\"label\":\"\",\"children\":[{\"label\":\"\"}]}]}",
  INFOGRAPHIC: "Gere um infográfico resumindo os pontos-chave do conteúdo em tópicos objetivos. Responda em JSON com formato {\"title\":\"\",\"sections\":[{\"heading\":\"\",\"points\":[\"\"]}]}",
  RESUMO: "Escreva um resumo didático e objetivo do conteúdo, destacando os conceitos principais. Responda em JSON com formato {\"title\":\"\",\"summary\":\"\",\"keyPoints\":[\"\"]}",
};

const TRANSCRIBE_PROMPT =
  "Transcreva fielmente todo o conteúdo de áudio/vídeo em texto corrido, em português. " +
  "Mantenha a ordem do que foi dito, sem resumir e sem comentários. Responda apenas com a transcrição.";

async function callGemini(apiKey: string, prompt: string, mediaUrl?: string | null): Promise<string> {
  const parts: Record<string, unknown>[] = [];
  if (mediaUrl && /^https?:\/\//.test(mediaUrl)) {
    const watch = toWatchUrl(mediaUrl);
    parts.push({
      file_data: {
        file_uri: watch ?? mediaUrl,
        mime_type: watch || /youtube|youtu\.be/.test(mediaUrl) ? "video/mp4" : "audio/mpeg",
      },
    });
  }
  parts.push({ text: prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    let message = `Erro na API Gemini (${res.status})`;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      message = parsed.error?.message ?? message;
    } catch {
      /* keep generic message */
    }
    throw new BadRequestError(message.slice(0, 300));
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new BadRequestError("A API Gemini não retornou conteúdo");
  return text;
}

function parseJsonOutput(raw: string): unknown {
  try {
    return JSON.parse(raw.replace(/^```json\s*|```$/g, ""));
  } catch {
    return { raw };
  }
}

async function getApiKey(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });
  if (!user?.geminiApiKey) {
    throw new ConflictError("Você ainda não configurou sua chave da API Gemini. Adicione em Dados de estudo.");
  }
  return decryptApiKey(user.geminiApiKey);
}

function buildPrompt(basePrompt: string, context: StudyContext, transcription: string | null): string {
  return `${basePrompt}

Baseie-se exclusivamente no conteúdo abaixo (conteúdo odontológico). Seja preciso e fiel à fonte.
Título: ${context.titulo}
Descrição: ${context.descricao}
Observações: ${context.observacoes}
Especialidade: ${context.especialidade}
Tags: ${context.tags}
Casos relacionados: ${JSON.stringify(context.casosRelacionados)}
${transcription ? `Transcrição do conteúdo:\n${transcription}` : ""}`;
}

async function findLatestTranscription(context: StudyContext) {
  const t = await prisma.studyResource.findFirst({
    where: { type: "TRANSCRICAO", ...(context.type === "video" ? { videoId: context.id } : { caseStudyId: context.id }) },
    orderBy: { createdAt: "desc" },
    select: { content: true },
  });
  if (!t) return null;
  return (t.content as { text?: string }).text?.trim() ? t.content : null;
}

export async function generateResource(userId: string, input: GenerateResourceInput) {
  const apiKey = await getApiKey(userId);
  if (!input.type) throw new BadRequestError("Informe o tipo de recurso");

  const context = input.caseStudyId
    ? await buildCaseContext(input.caseStudyId)
    : await buildVideoContext(input.videoId!);

  let transcription: string | null = null;
  if (input.useTranscription) {
    const t = await findLatestTranscription(context);
    if (t) {
      transcription = (t as { text?: string }).text?.trim() ? (t as { text: string }).text : null;
    }
  }

  const prompt = buildPrompt(PROMPTS[input.type], context, transcription);
  const raw = await callGemini(apiKey, prompt);
  const content = parseJsonOutput(raw);

  return prisma.studyResource.create({
    data: {
      videoId: context.type === "video" ? context.id : null,
      caseStudyId: context.type === "case" ? context.id : null,
      authorId: userId,
      type: input.type,
      title: `Estudo gerado por IA — ${context.titulo}`,
      content: content as Prisma.InputJsonValue,
      status: "RASCUNHO",
    },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      content: true,
      audioUrl: true,
      createdAt: true,
    },
  });
}

export async function generateAll(userId: string, input: GenerateResourceInput) {
  const apiKey = await getApiKey(userId);

  const context = input.caseStudyId
    ? await buildCaseContext(input.caseStudyId)
    : await buildVideoContext(input.videoId!);

  const transcriptionSource =
    input.useTranscription || input.generateAll
      ? await findLatestTranscription(context)
      : null;
  const transcription = transcriptionSource
    ? (transcriptionSource as { text?: string }).text?.trim() ?? null
    : null;

  const created: Awaited<ReturnType<typeof generateResource>>[] = [];
  for (const type of GENERATABLE_TYPES) {
    const prompt = buildPrompt(PROMPTS[type], context, transcription);
    const raw = await callGemini(apiKey, prompt);
    const content = parseJsonOutput(raw);
    const resource = await prisma.studyResource.create({
      data: {
        videoId: context.type === "video" ? context.id : null,
        caseStudyId: context.type === "case" ? context.id : null,
        authorId: userId,
        type,
        title: `Estudo gerado por IA — ${context.titulo}`,
        content: content as Prisma.InputJsonValue,
        status: "RASCUNHO",
      },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        content: true,
        audioUrl: true,
        createdAt: true,
      },
    });
    created.push(resource);
  }

  return created;
}

export async function transcribeResource(userId: string, input: { videoId?: string; caseStudyId?: string }) {
  const apiKey = await getApiKey(userId);

  const context = input.caseStudyId
    ? await buildCaseContext(input.caseStudyId)
    : await buildVideoContext(input.videoId!);

  if (!context.mediaUrl || !/^https?:\/\//.test(context.mediaUrl)) {
    throw new ConflictError(
      "Não há mídia pública disponível para transcrição (vídeo/áudio não configurado). Use a descrição para gerar os estudos."
    );
  }

  const isYouTube = /youtube\.com|youtu\.be/.test(context.mediaUrl);
  const videoId = toWatchUrl(context.mediaUrl);
  if (isYouTube && !videoId) {
    throw new ConflictError(
      "Este vídeo não possui uma URL pública do YouTube válida para transcrição. Use a descrição para gerar os estudos."
    );
  }

  const raw = await callGemini(apiKey, TRANSCRIBE_PROMPT, context.mediaUrl);
  const content = parseJsonOutput(raw);
  const text = typeof content === "string" ? content : (content as { raw?: string }).raw ?? JSON.stringify(content);

  const resource = await prisma.studyResource.create({
    data: {
      videoId: context.type === "video" ? context.id : null,
      caseStudyId: context.type === "case" ? context.id : null,
      authorId: userId,
      type: "TRANSCRICAO",
      title: `Transcrição — ${context.titulo}`,
      content: { text } as Prisma.InputJsonValue,
      status: "RASCUNHO",
    },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      content: true,
      audioUrl: true,
      createdAt: true,
    },
  });

  return resource;
}