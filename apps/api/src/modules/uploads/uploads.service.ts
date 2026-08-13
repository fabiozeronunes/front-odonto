import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

const UPLOADS_BASE = path.resolve(process.cwd(), "public", "uploads");

fs.mkdirSync(UPLOADS_BASE, { recursive: true });

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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const userId = (_req as { user?: { id: string } }).user?.id ?? "anon";
    const dir = path.join(UPLOADS_BASE, userId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIMES[file.mimetype] ?? path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) return cb(null, true);
    cb(new Error("Formato inválido. Use imagens (JPG, PNG, WEBP, GIF) ou áudio (WEBM, MP3, OGG, WAV)."));
  },
});

export function toPublicUrl(userId: string, filename: string) {
  return `/uploads/${userId}/${filename}`;
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function listMyUploads(userId: string): { url: string; name: string }[] {
  const dir = path.join(UPLOADS_BASE, userId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .map((name) => ({ url: toPublicUrl(userId, name), name }))
    .sort((a, b) => b.name.localeCompare(a.name));
}