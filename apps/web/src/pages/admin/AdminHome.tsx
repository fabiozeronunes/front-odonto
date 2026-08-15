import { useEffect, useState } from "react";
import { Link2, Trash2, Video } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { InfoPopover } from "../../components/ui/info-popover";

export function AdminHome() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ data: string | null }>("/api/settings/hero-video", { skipAuth: true });
      setUrl(res.data ?? "");
      setSaved(res.data ?? null);
    } catch {
      setUrl("");
      setSaved(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const link = url.trim();
    if (!link) return;
    setSaving(true);
    try {
      const res = await api<{ data: string }>("/api/settings/hero-video", {
        method: "POST",
        body: JSON.stringify({ url: link }),
      });
      setSaved(res.data);
      setNotice("Vídeo da hero atualizado. A página inicial já exibe o novo vídeo.");
    } catch (err) {
      setNotice(null);
      setSaved(url);
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await api("/api/settings/hero-video", { method: "DELETE" });
      setUrl("");
      setSaved(null);
      setNotice("Vídeo removido. A hero voltou a exibir o mockup padrão.");
    } catch {
      setNotice(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
    );
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        Página inicial
        <InfoPopover
          title="Vídeo da hero"
          text="Cole o link de um vídeo (YouTube) para que ele apareça no topo da página inicial, no lugar do mockup. O vídeo fica visível para todos os visitantes."
        />
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Configure o vídeo exibido no bloco principal do topo da home.
      </p>

      {notice && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4" /> Vídeo da hero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="https://www.youtube.com/embed/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400">
            Use o link de incorporação do YouTube (compartilhar → Incorporar → link da
            iframe), ex.: <span className="font-mono">https://www.youtube.com/embed/VIDEO_ID</span>
          </p>

          {saved ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                src={saved}
                title="Vídeo da hero"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
              Nenhum vídeo configurado — a hero exibe o mockup padrão.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving || !url.trim()}>
              {saving ? "Salvando..." : saved ? "Atualizar vídeo" : "Salvar vídeo"}
            </Button>
            {saved && (
              <Button variant="outline" disabled={saving} onClick={remove}>
                <Trash2 className="h-4 w-4" /> Remover vídeo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
