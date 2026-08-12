import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { ApiError } from "../../utils/errors.js";

export function parseYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getInfo(url: string) {
  const videoId = parseYoutubeId(url);
  if (!videoId) throw new ApiError(400, "URL do YouTube inválida");

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new ApiError(404, "Vídeo não encontrado no YouTube");
  }
  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
    html?: string;
  };

  return {
    id: videoId,
    title: data.title ?? "Vídeo do YouTube",
    author: data.author_name ?? "",
    authorUrl: data.author_url ?? "",
    thumbnailUrl: data.thumbnail_url?.replace("hqdefault", "maxresdefault") ?? "",
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export function ytDlpAvailable(): boolean {
  try {
    execSync("which yt-dlp", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function downloadVideo(
  url: string,
  videoId: string,
  destinationDir: string
): Promise<{ file: string }> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(destinationDir, { recursive: true });
    const output = path.join(destinationDir, `${videoId}.%(ext)s`);
    const proc = spawn(
      "yt-dlp",
      [
        "--no-playlist",
        "--no-part",
        "-f",
        "best[ext=mp4]/best",
        "-o",
        output,
        url,
      ],
      { stdio: ["ignore", "ignore", "ignore"] }
    );
    proc.on("error", (err) => reject(new ApiError(503, `yt-dlp não executou: ${err.message}`)));
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new ApiError(502, "Falha ao baixar o vídeo do YouTube"));
      }
      const files = fs.readdirSync(destinationDir);
      const file = files.find((f) => f.startsWith(videoId) && !f.includes(".part"));
      if (!file) return reject(new ApiError(502, "Arquivo de vídeo não gerado pelo yt-dlp"));
      resolve({ file });
    });
  });
}