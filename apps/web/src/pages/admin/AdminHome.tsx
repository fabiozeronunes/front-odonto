import { useEffect, useState } from "react";
import { Trash2, Video, Lock, Type, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { YouTubeImport } from "../../components/YouTubeImport";
import { InfoPopover } from "../../components/ui/info-popover";

interface HeroSuggestion {
  trigger: string;
  title: string;
  subtitle: string;
}

export function AdminHome() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroBusinessArea, setHeroBusinessArea] = useState("");
  const [heroTags, setHeroTags] = useState("");
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroNotice, setHeroNotice] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<HeroSuggestion[]>([]);
  const [genNotice, setGenNotice] = useState<string | null>(null);

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
      const content = await api<{
        data: { title: string; subtitle: string; businessArea: string; tags: string };
      }>("/api/settings/hero-content", { skipAuth: true });
      setHeroTitle(content.data?.title ?? "");
      setHeroSubtitle(content.data?.subtitle ?? "");
      setHeroBusinessArea(content.data?.businessArea ?? "");
      setHeroTags(content.data?.tags ?? "");
    } catch {
      setHeroTitle("");
      setHeroSubtitle("");
      setHeroBusinessArea("");
      setHeroTags("");
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

  async function saveHeroContent() {
    setHeroSaving(true);
    setHeroNotice(null);
    try {
      await api("/api/settings/hero-content", {
        method: "POST",
        body: JSON.stringify({
          title: heroTitle,
          subtitle: heroSubtitle,
          businessArea: heroBusinessArea,
          tags: heroTags,
        }),
      });
      setHeroNotice("Título e subtítulo atualizados. A home já exibe o novo conteúdo.");
    } catch {
      setHeroNotice("Falha ao salvar o conteúdo. Tente novamente.");
    } finally {
      setHeroSaving(false);
    }
  }

  async function generateHero() {
    setGenerating(true);
    setGenNotice(null);
    setSuggestions([]);
    try {
      const res = await api<{ data: HeroSuggestion[] }>("/api/settings/hero-generate", {
        method: "POST",
        body: JSON.stringify({ businessArea: heroBusinessArea, tags: heroTags, count: 5 }),
      });
      setSuggestions(res.data ?? []);
      if (!res.data?.length) setGenNotice("Nenhuma sugestão retornada. Tente novamente.");
    } catch {
      setGenNotice("Falha ao gerar sugestões. Confira se a chave Gemini está configurada no admin.");
    } finally {
      setGenerating(false);
    }
  }

  function applySuggestion(s: HeroSuggestion) {
    setHeroTitle(s.title);
    setHeroSubtitle(s.subtitle);
    setGenNotice("Sugestão aplicada nos campos. Clique em Salvar para publicar.");
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
            <Type className="h-4 w-4" /> Título e subtítulo da hero
            <InfoPopover
              title="Conteúdo da hero"
              text="Edite o título e o subtítulo exibidos na primeira dobra. Use o gerador com gatilhos mentais para criar variações baseadas no ramo de atividade e nas tags."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroNotice && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{heroNotice}</div>
          )}

          <div>
            <label htmlFor="hero-title" className="text-sm font-medium text-slate-700">
              Título
            </label>
            <textarea
              id="hero-title"
              rows={2}
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Envolva uma palavra ou expressão com{" "}
              <span className="font-mono font-semibold text-slate-700">*asteriscos*</span> para
              aplicá-la o degrade da logomarca. Ex.:{" "}
              <span className="font-mono">Domine a *Odontologia* estudando...</span>
            </p>
          </div>

          <div>
            <label htmlFor="hero-subtitle" className="text-sm font-medium text-slate-700">
              Subtítulo
            </label>
            <textarea
              id="hero-subtitle"
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <Button onClick={saveHeroContent} disabled={heroSaving}>
            {heroSaving ? "Salvando..." : "Salvar título e subtítulo"}
          </Button>

          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-teal-800">
              <Sparkles className="h-4 w-4" /> Gerar com IA — gatilhos mentais
            </p>
            <p className="mt-1 text-xs text-teal-700">
              Informe o ramo de atividade e tags relacionadas. A IA gera variações de título e
              subtítulo usando gatilhos mentais de conversão.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="hero-business" className="text-xs font-medium text-teal-900">
                  Ramo de atividade
                </label>
                <input
                  id="hero-business"
                  value={heroBusinessArea}
                  onChange={(e) => setHeroBusinessArea(e.target.value)}
                  placeholder="ex.: odontologia / educação odontológica"
                  className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="hero-tags" className="text-xs font-medium text-teal-900">
                  Tags relacionadas
                </label>
                <input
                  id="hero-tags"
                  value={heroTags}
                  onChange={(e) => setHeroTags(e.target.value)}
                  placeholder="ex.: concurso, residência, preparação"
                  className="mt-1 w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <Button
              className="mt-3"
              variant="premium"
              onClick={generateHero}
              disabled={generating}
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {generating ? "Gerando..." : "Gerar sugestões"}
            </Button>

            {genNotice && (
              <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">{genNotice}</div>
            )}

            {suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="w-full rounded-xl border border-teal-200 bg-white p-3 text-left transition hover:border-teal-400 hover:shadow-sm"
                  >
                    <span className="inline-block rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                      {s.trigger}
                    </span>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">{s.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.subtitle}</p>
                  </button>
                ))}
                <p className="text-xs text-teal-700">
                  Clique em uma sugestão para preenchê-la nos campos acima e depois salve.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
