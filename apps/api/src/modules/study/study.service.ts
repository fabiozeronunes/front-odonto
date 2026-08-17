import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import type { Prisma } from "@prisma/client";
import type { SaveResourceInput, GenerateResourceInput } from "./study.validators.js";

const ALGO = "aes-256-gcm";

function encryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.jwtSecret).digest();
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
  const video = await prisma.video.findUnique({ where: { id: input.videoId }, select: { id: true } });
  if (!video) throw new NotFoundError("Vídeo não encontrado");

  return prisma.studyResource.create({
    data: {
      videoId: input.videoId,
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
      _count: { select: { votes: true } },
    },
  });
}

export async function listVideoResources(userId: string, videoId: string) {
  const video = await prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
  if (!video) throw new NotFoundError("Vídeo não encontrado");

  const resources = await prisma.studyResource.findMany({
    where: { videoId, OR: [{ status: "PUBLICADO" }, { authorId: userId }] },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      content: true,
      audioUrl: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
      _count: { select: { votes: true } },
    },
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

async function buildContext(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      title: true,
      description: true,
      observations: true,
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
    titulo: video.title,
    descricao: video.description ?? "",
    observacoes: video.observations ?? "",
    especialidade: video.specialty?.name ?? "",
    tags: video.tags.map((t) => t.tag.name).join(", "),
    casosRelacionados: video.caseStudies.map(
      (c) => `${c.caseStudy.title}: ${c.caseStudy.description ?? ""} ${c.caseStudy.diagnosis ?? ""}`
    ),
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

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erro na API Gemini (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("A API Gemini não retornou conteúdo");
  return text;
}

export async function generateResource(userId: string, input: GenerateResourceInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });
  if (!user?.geminiApiKey) {
    throw new ConflictError("Você ainda não configurou sua chave da API Gemini. Adicione em Dados de estudo.");
  }

  const context = await buildContext(input.videoId);
  const prompt = `${PROMPTS[input.type]}

Baseie-se exclusivamente no conteúdo abaixo (conteúdo odontológico). Seja preciso e fiel à fonte.
Título: ${context.titulo}
Descrição: ${context.descricao}
Observações: ${context.observacoes}
Especialidade: ${context.especialidade}
Tags: ${context.tags}
Casos relacionados: ${JSON.stringify(context.casosRelacionados)}`;

  const raw = await callGemini(decryptApiKey(user.geminiApiKey), prompt);

  let content: unknown;
  try {
    content = JSON.parse(raw.replace(/^```json\s*|```$/g, ""));
  } catch {
    content = { raw };
  }

  return prisma.studyResource.create({
    data: {
      videoId: input.videoId,
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