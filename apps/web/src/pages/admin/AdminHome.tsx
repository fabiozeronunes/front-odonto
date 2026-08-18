import { useEffect, useState } from "react";
import { Trash2, Video, Lock } from "lucide-react";
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

  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(0);
  const [lockSaving, setLockSaving] = useState(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ data: string | null }>("/api/settings/hero-video", { skipAuth: true });
      setPreviewUrl(res.data ?? null);
      setSavedUrl(res.data ?? null);
    } catch {
      setPreviewUrl(null);
      setSavedUrl(null);
    }
    try {
      const lock = await api<{ data: { enabled: boolean; unlockMinutes: number } }>(
        "/api/settings/home-lock",
        { skipAuth: true }
      );
      setLockEnabled(lock.data?.enabled ?? false);
      setLockMinutes(lock.data?.unlockMinutes ?? 0);
    } catch {
      setLockEnabled(false);
      setLockMinutes(0);
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

  async function saveLock() {
    setLockSaving(true);
    setLockNotice(null);
    try {
      const res = await api<{ data: { enabled: boolean; unlockMinutes: number } }>(
        "/api/settings/home-lock",
        {
          method: "POST",
          body: JSON.stringify({ enabled: lockEnabled, unlockMinutes: lockMinutes }),
        }
      );
      setLockEnabled(res.data.enabled);
      setLockMinutes(res.data.unlockMinutes);
      setLockNotice(
        res.data.enabled
          ? `Trava ativada. Visitantes anônimos verão apenas a primeira dobra até o vídeo terminar${res.data.unlockMinutes > 0 ? ` ou ${res.data.unlockMinutes} min` : ""}.`
          : "Trava desativada. Todos veem a página completa."
      );
    } catch {
      setLockNotice("Falha ao salvar a configuração.");
    } finally {
      setLockSaving(false);
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

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Bloqueio da página inicial (VSL)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoPopover
            title="Bloqueio VSL"
            text="Com o vídeo da hero configurado, visitantes anônimos veem apenas a primeira dobra (hero + vídeo + rodapé). A página completa é liberada quando o vídeo termina (ou após os minutos definidos). Usuários logados veem tudo normalmente."
          />

          {lockNotice && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{lockNotice}</div>
          )}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Ativar bloqueio para anônimos</p>
              <p className="text-xs text-slate-500">Requere um vídeo configurado na hero.</p>
            </div>
            <input
              type="checkbox"
              checked={lockEnabled}
              onChange={(e) => setLockEnabled(e.target.checked)}
              className="h-5 w-5 accent-teal-600"
            />
          </label>

          <div>
            <label htmlFor="lock-minutes" className="text-sm font-medium text-slate-700">
              Liberar automaticamente após (minutos)
            </label>
            <input
              id="lock-minutes"
              type="number"
              min={0}
              value={lockMinutes}
              onChange={(e) => setLockMinutes(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900"
            />
            <p className="mt-1 text-xs text-slate-400">
              0 = só libera quando o vídeo terminar.
            </p>
          </div>

          <Button onClick={saveLock} disabled={lockSaving}>
            <Lock className="h-4 w-4" /> {lockSaving ? "Salvando..." : "Salvar configuração"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
