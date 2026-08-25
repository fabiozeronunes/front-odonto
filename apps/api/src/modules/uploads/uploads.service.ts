import crypto from "node:crypto";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

export const storage = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const STORAGE_BUCKET = "uploads";

const ALLOWED_MIMES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "audio/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
  "audio/wave": ".wav",
  "audio/mp4": ".m4a",
  "video/webm": ".webm",
  "video/mp4": ".mp4",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
};

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_MIMES = new Set(["video/webm", "video/mp4", "video/ogg", "video/quicktime"]);

const LIMITS = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 50 * 1024 * 1024,  // 50 MB
  audio: 20 * 1024 * 1024,  // 20 MB
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LIMITS.video, // max default, refined in fileFilter
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      return cb(new Error("Formato inválido. Use imagens (JPG, PNG, WEBP, GIF), áudio (WEBM, MP3, OGG, WAV) ou vídeo (WEBM, MP4)."));
    }
    const limit = IMAGE_MIMES.has(file.mimetype) ? LIMITS.image
      : VIDEO_MIMES.has(file.mimetype) ? LIMITS.video
      : LIMITS.audio;
    (file as any).__sizeLimit = limit;
    cb(null, true);
  },
});

export async function saveUploadedFile(
  userId: string,
  file: Express.Multer.File
): Promise<string> {
  const ext = ALLOWED_MIMES[file.mimetype] ?? ".bin";
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const path = `${userId}/${filename}`;

  const { error } = await storage.storage.from(STORAGE_BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: true,
  });
  if (error) {
    console.error("[upload] Supabase error:", error.message, error);
    throw new Error(`Falha ao enviar arquivo para o armazenamento: ${error.message}`);
  }

  return toPublicUrl(path);
}

export function toPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export async function listMyUploads(userId: string): Promise<{ url: string; name: string }[]> {
  const { data } = await storage.storage
    .from(STORAGE_BUCKET)
    .list(userId, { sortBy: { column: "name", order: "desc" } });

  if (!data) return [];

  return (data ?? [])
    .filter((item) => {
      const ext = "." + (item.name.split(".").pop()?.toLowerCase() ?? "");
      return IMAGE_EXT.has(ext);
    })
    .map((item) => ({
      url: toPublicUrl(`${userId}/${item.name}`),
      name: item.name,
    }));
}

export async function generateSignedUploadUrl(userId: string, filename: string, contentType: string) {
  const ext = ALLOWED_MIMES[contentType];
  if (!ext) throw new Error("Tipo de arquivo não permitido");
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const path = `${userId}/${uniqueName}`;

  const { data, error } = await storage.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(`Falha ao gerar URL de upload: ${error.message}`);

  return {
    signedUrl: data.signedUrl,
    path,
    publicUrl: toPublicUrl(path),
  };
}
