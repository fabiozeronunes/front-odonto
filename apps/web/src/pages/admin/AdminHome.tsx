import { useEffect, useState } from "react";
import { Trash2, Video, Lock, Type, Sparkles, RefreshCw, Wand2, Gauge, HelpCircle, Plus } from "lucide-react";
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

interface FaqItem {
  id: string;
  groupId: string;
  question: string;
  answer: string;
}

interface FaqGroup {
  id: string;
  title: string;
  tag: string;
  featured: boolean;
}

interface FaqData {
  dicaTitle: string;
  dicaText: string;
  dicaCta: string;
  dicaLink: string;
  groups: FaqGroup[];
  items: FaqItem[];
}

const FAQ_EMPTY: FaqData = {
  dicaTitle: "Dica de ouro",
  dicaText: "",
  dicaCta: "Ver planos",
  dicaLink: "#planos",
  groups: [
    { id: "planos-acesso", title: "Escolha o plano ideal", tag: "Planos de assinatura", featured: true },
    { id: "recursos-ia", title: "Recursos com inteligência", tag: "IA", featured: false },
    { id: "planos-extra", title: "Planos de assinatura", tag: "Planos", featured: false },
    { id: "pagamento", title: "Pagamento", tag: "Pagamento", featured: false },
  ],
  items: [],
};

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

  const [progressBoost, setProgressBoost] = useState(1.2);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressNotice, setProgressNotice] = useState<string | null>(null);

  const [faq, setFaq] = useState<FaqData>(FAQ_EMPTY);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqNotice, setFaqNotice] = useState<string | null>(null);

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
    }
    try {
      const progress = await api<{ data: { boost: number } }>(
        "/api/settings/hero-smart-progress",
        { skipAuth: true }
      );
      setProgressBoost(progress.data?.boost ?? 1.2);
    } catch {
      setProgressBoost(1.2);
    }
    try {
      const faqRes = await api<{ data: FaqData }>("/api/settings/faq", { skipAuth: true });
      if (faqRes.data) setFaq(faqRes.data);
    } catch {
      // use defaults
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

  async function saveProgress() {
    setProgressSaving(true);
    setProgressNotice(null);
    try {
      const res = await api<{ data: { boost: number } }>("/api/settings/hero-smart-progress", {
        method: "POST",
        body: JSON.stringify({ boost: progressBoost }),
      });
      setProgressBoost(res.data?.boost ?? 1.2);
      setProgressNotice(
        `Barra configurada. Velocidade ${progressBoost.toLocaleString("pt-BR")}x — a barra enche aos ${Math.round(
          (100 / progressBoost)
        )}% do vídeo.`
      );
    } catch {
      setProgressNotice("Falha ao salvar a configuração.");
    } finally {
      setProgressSaving(false);
    }
  }

  async function saveFaq() {
    setFaqSaving(true);
    setFaqNotice(null);
    try {
      await api("/api/settings/faq", { method: "POST", body: JSON.stringify(faq) });
      setFaqNotice("FAQ salvo com sucesso. As alterações já estão visíveis na home.");
    } catch {
      setFaqNotice("Falha ao salvar o FAQ. Tente novamente.");
    } finally {
      setFaqSaving(false);
    }
  }

  function updateFaqGroup(id: string, patch: Partial<FaqGroup>) {
    setFaq((f) => ({ ...f, groups: f.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }

  function updateFaqItem(id: string, patch: Partial<FaqItem>) {
    setFaq((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  }

  function removeFaqItem(id: string) {
    setFaq((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));
  }

  function addFaqItem(groupId: string) {
    setFaq((f) => ({
      ...f,
      items: [...f.items, { id: crypto.randomUUID(), groupId, question: "", answer: "" }],
    }));
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
            <Gauge className="h-4 w-4" /> Progresso Inteligente™ da barra do vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoPopover
            title="Progresso Inteligente"
            text="A barra de progresso avança mais rápido que o tempo real do vídeo, dando a impressão de que o vídeo é mais curto. Isso aumenta a retenção e a conversão. O desbloqueio do conteúdo continua atrelado ao fim real do vídeo."
          />

          {progressNotice && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {progressNotice}
            </div>
          )}

          <div>
            <label htmlFor="progress-boost" className="text-sm font-medium text-slate-700">
              Velocidade da barra: {progressBoost.toLocaleString("pt-BR")}x
            </label>
            <input
              id="progress-boost"
              type="range"
              min={1}
              max={2}
              step={0.1}
              value={progressBoost}
              onChange={(e) => setProgressBoost(Number(e.target.value))}
              className="mt-2 w-full accent-teal-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>1.0x — normal</span>
              <span>1.5x — média</span>
              <span>2.0x — agressiva</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Com {progressBoost.toLocaleString("pt-BR")}x, a barra enche aos{" "}
              <span className="font-semibold text-slate-700">
                {Math.round(100 / progressBoost)}%
              </span>{" "}
              do vídeo e segura até o fim.
            </p>
          </div>

          <Button onClick={saveProgress} disabled={progressSaving}>
            <Gauge className="h-4 w-4" /> {progressSaving ? "Salvando..." : "Salvar velocidade"}
          </Button>
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

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" /> Perguntas frequentes (FAQ)
            <InfoPopover
              title="FAQ da home"
              text="Edite as perguntas e respostas exibidas na seção 'Perguntas frequentes' da página inicial. Os grupos são fixos (Planos de assinatura, Recursos com IA, Planos extras, Pagamento). Clique em '+' para adicionar uma pergunta ao grupo."
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqNotice && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{faqNotice}</div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-sm font-semibold text-amber-800">Dica de ouro (destaque âmbar)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={faq.dicaTitle}
                onChange={(e) => setFaq((f) => ({ ...f, dicaTitle: e.target.value }))}
                placeholder="Título"
                className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={faq.dicaCta}
                onChange={(e) => setFaq((f) => ({ ...f, dicaCta: e.target.value }))}
                placeholder="Texto do botão"
                className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={faq.dicaText}
              onChange={(e) => setFaq((f) => ({ ...f, dicaText: e.target.value }))}
              placeholder="Texto da dica"
              rows={2}
              className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-4">
            {faq.groups.map((group) => {
              const groupItems = faq.items.filter((it) => it.groupId === group.id);
              return (
                <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700">
                        {group.tag}
                      </span>
                      {group.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                          Destaque
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      value={group.title}
                      onChange={(e) => updateFaqGroup(group.id, { title: e.target.value })}
                      placeholder="Título do grupo"
                      className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    />
                    <input
                      value={group.tag}
                      onChange={(e) => updateFaqGroup(group.id, { tag: e.target.value })}
                      placeholder="Tag"
                      className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-3 space-y-3">
                    {groupItems.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-white p-3">
                        <input
                          value={item.question}
                          onChange={(e) => updateFaqItem(item.id, { question: e.target.value })}
                          placeholder="Pergunta"
                          className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm font-medium"
                        />
                        <textarea
                          value={item.answer}
                          onChange={(e) => updateFaqItem(item.id, { answer: e.target.value })}
                          placeholder="Resposta"
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFaqItem(item.id)}
                          className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addFaqItem(group.id)}
                      className="flex items-center gap-1 rounded-lg border border-dashed border-teal-300 bg-teal-50/60 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-100/60"
                    >
                      <Plus className="h-3 w-3" /> Adicionar pergunta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={saveFaq} disabled={faqSaving}>
            <HelpCircle className="h-4 w-4" /> {faqSaving ? "Salvando..." : "Salvar FAQ"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
