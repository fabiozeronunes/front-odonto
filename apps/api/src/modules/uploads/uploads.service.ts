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
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) return cb(null, true);
    cb(new Error("Formato inválido. Use imagens (JPG, PNG, WEBP, GIF) ou áudio (WEBM, MP3, OGG, WAV)."));
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
