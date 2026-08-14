import { useState } from "react";
import { Check, Download, Loader2, Search, Youtube } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface YouTubeVideo {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  embedUrl: string;
  watchUrl: string;
  absoluteVideoUrl?: string;
}

interface YouTubeImportProps {
  onInfo: (info: {
    title?: string;
    author?: string;
    thumbnailUrl?: string;
    videoUrl: string;
  }) => void;
}

export function YouTubeImport({ onInfo }: YouTubeImportProps) {
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function search() {
    if (!url.trim()) return;
    setLoading(true);
    setMessage(null);
    setInfo(null);
    try {
      const res = await api<{ data: YouTubeVideo }>(
        `/api/youtube/info?url=${encodeURIComponent(url.trim())}`
      );
      setInfo(res.data);
      setMessage("Vídeo encontrado! Toque em \"Usar link\" para preencher o formulário.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha ao buscar vídeo");
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!info) return;
    setDownloading(true);
    setMessage(null);
    try {
      const res = await api<{ data: YouTubeVideo }>("/api/youtube/import", {
        method: "POST",
        body: JSON.stringify({ url: info.watchUrl }),
      });
      setInfo(res.data);
      onInfo({
        title: res.data.title,
        author: res.data.author,
        thumbnailUrl: res.data.thumbnailUrl,
        videoUrl: res.data.absoluteVideoUrl ?? res.data.embedUrl,
      });
      setMessage("Vídeo baixado! URL preenchida.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no download";
      setMessage(msg.includes("yt-dlp") ? msg + " (instale o yt-dlp no servidor)" : msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Youtube className="h-4 w-4 text-red-600" /> Importar do YouTube
      </p>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Cole o link do YouTube..."
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
        />
        <Button type="button" variant="outline" onClick={search} disabled={loading || !url.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
        </Button>
      </div>

      {message && <p className="mt-2 text-sm text-amber-700">{message}</p>}

      {info && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          {info.thumbnailUrl && (
            <img src={info.thumbnailUrl} alt="" className="h-24 w-40 rounded-lg object-cover" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{info.title}</p>
            <p className="text-xs text-muted-foreground">{info.author}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onInfo({
                    title: info.title,
                    author: info.author,
                    thumbnailUrl: info.thumbnailUrl,
                    videoUrl: info.embedUrl,
                  })
                }
              >
                <Check className="h-3 w-3" /> Usar link do vídeo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={download}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Baixar vídeo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}