import { useEffect, useState } from "react";
import { Trash2, Video } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { YouTubeImport } from "../../components/YouTubeImport";
import { InfoPopover } from "../../components/ui/info-popover";

export function AdminHome() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ data: string | null }>("/api/settings/hero-video", { skipAuth: true });
      setPreviewUrl(res.data ?? null);
      setSavedUrl(res.data ?? null);
    } catch {
      setPreviewUrl(null);
      setSavedUrl(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!previewUrl) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await api<{ data: string }>("/api/settings/hero-video", {
        method: "POST",
        body: JSON.stringify({ url: previewUrl }),
      });
      setSavedUrl(res.data);
      setNotice("Vídeo da hero atualizado. A página inicial já exibe o novo vídeo.");
    } catch {
      setNotice("Falha ao salvar o vídeo. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setNotice(null);
    try {
      await api("/api/settings/hero-video", { method: "DELETE" });
      setPreviewUrl(null);
      setSavedUrl(null);
      setNotice("Vídeo removido. A hero voltou a exibir o mockup padrão.");
    } catch {
      setNotice("Falha ao remover o vídeo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        Página inicial
        <InfoPopover
          title="Vídeo da hero"
          text="Cole o link de um vídeo do YouTube. Ao importar, o vídeo aparece abaixo para você conferir e depois salvar. O vídeo fica visível para todos os visitantes no topo da home."
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
          <YouTubeImport
            onInfo={({ videoUrl }) => {
              setPreviewUrl(videoUrl);
              setSavedUrl(null);
            }}
          />

          {previewUrl && (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                src={previewUrl}
                title="Vídeo da hero"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving || !previewUrl}>
              {saving ? "Salvando..." : "Salvar vídeo"}
            </Button>
            {savedUrl && (
              <Button variant="outline" disabled={saving} onClick={remove}>
                <Trash2 className="h-4 w-4" /> Remover vídeo
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Ao importar, o vídeo aparece acima para conferência antes de salvar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
