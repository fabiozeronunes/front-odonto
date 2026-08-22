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
    const instances = [
      "https://cobaltapi.cjs.nz",
      "https://api.cobalt.liubquanti.click",
      ((import.meta.env.VITE_COBALT_API_URL as string | undefined) ||
        "").replace(/\/+$/, "").replace(/\/api\/json$/, ""),
      "https://cobaltapi.kittycat.boo",
      "https://dog.kittycat.boo",
    ].filter(Boolean) as string[];

    for (const instance of instances) {
      try {
        const res = await fetch(instance, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: info.watchUrl,
            downloadMode: "auto",
            videoQuality: "720",
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          status?: string;
          url?: string;
          filename?: string;
          text?: string;
          error?: { code?: string };
        } | null;
        if (data && (data.status === "redirect" || data.status === "tunnel") && data.url) {
          const saved = await saveToDownloads(data.url, data.filename);
          if (saved) {
            setMessage("Download salvo na pasta de downloads do navegador.");
          } else {
            window.open(data.url, "_blank", "noopener");
            setMessage("Não foi possível baixar direto; abri a URL do arquivo em uma nova aba.");
          }
          setDownloading(false);
          return;
        }
        if (data?.status === "picker") {
          setMessage("O YouTube exige escolher entre vídeo/áudio. Use \"Usar link do vídeo\".");
          setDownloading(false);
          return;
        }
        if (data?.status === "error") {
          continue;
        }
      } catch {
        continue;
      }
    }
    setMessage("Nenhum serviço de download respondeu. Use \"Usar link do vídeo\".");
    setDownloading(false);
  }

  async function saveToDownloads(url: string, filename?: string): Promise<boolean> {
    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      const blob = await res.blob();
      if (blob.size === 0) return false;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || `video-${info?.id ?? Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      return true;
    } catch {
      return false;
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted p-4">
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
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center overflow-hidden">
          {info.thumbnailUrl && (
            <img src={info.thumbnailUrl} alt="" className="h-24 w-40 shrink-0 rounded-lg object-cover" />
          )}
          <div className="min-w-0 flex-1">
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