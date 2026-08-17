import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  FileText,
  Headphones,
  Heart,
  LayoutList,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import type { StudyResource, StudyResourceType } from "../types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { StudyResourceRenderer } from "./StudyResourceRenderer";

const TYPES: { type: StudyResourceType; label: string; icon: typeof FileText }[] = [
  { type: "RESUMO", label: "Resumo", icon: FileText },
  { type: "QUIZ", label: "Quiz", icon: LayoutList },
  { type: "FLASHCARDS", label: "Flashcards", icon: Brain },
  { type: "QUESTIONARIO", label: "Questionário", icon: FileText },
  { type: "MIND_MAP", label: "Mapa mental", icon: Type },
  { type: "INFOGRAPHIC", label: "Infográfico", icon: FileText },
];

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em revisão",
  PUBLICADO: "Publicado",
  REJEITADO: "Rejeitado",
};

export function StudySection({ videoId, videoTitle }: { videoId: string; videoTitle: string }) {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<StudyResourceType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [hasKey, setHasKey] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api<{ data: StudyResource[] }>(`/api/study/video/${videoId}`)
      .then((d) => setResources(d.data))
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar estudos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api<{ data: { hasKey: boolean } }>("/api/study/gemini-key")
      .then((d) => setHasKey(d.data.hasKey))
      .catch(() => setHasKey(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  async function generate(type: StudyResourceType) {
    setError(null);
    setGenerating(type);
    try {
      const res = await api<StudyResource>(`/api/study/generate`, {
        method: "POST",
        body: JSON.stringify({ videoId, type }),
      });
      setResources((prev) => [res, ...prev]);
      setOpenId(res.id);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao gerar estudo");
    } finally {
      setGenerating(null);
    }
  }

  async function saveKey() {
    setSavingKey(true);
    setError(null);
    try {
      await api("/api/study/gemini-key", { method: "POST", body: JSON.stringify({ geminiApiKey: apiKey }) });
      setHasKey(true);
      setShowKeyForm(false);
      setApiKey("");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao salvar chave");
    } finally {
      setSavingKey(false);
    }
  }

  async function submitToLibrary(id: string) {
    try {
      await api(`/api/study/${id}/submit`, { method: "POST" });
      setResources((prev) => prev.map((r) => (r.id === id ? { ...r, status: "EM_REVISAO" } : r)));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao enviar para biblioteca");
    }
  }

  async function removeResource(id: string) {
    try {
      await api(`/api/study/${id}`, { method: "DELETE" });
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (openId === id) setOpenId(null);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao excluir estudo");
    }
  }

  const mine = useMemo(() => resources.filter((r) => r.mine), [resources]);
  const shared = useMemo(() => resources.filter((r) => !r.mine), [resources]);

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary-700" />
          <h2 className="font-display text-lg font-bold text-foreground">Estudar</h2>
        </div>
        {hasKey ? (
          <Button size="sm" variant="outline" onClick={() => setShowKeyForm((v) => !v)}>
            <Sparkles className="h-4 w-4" /> Trocar chave Gemini
          </Button>
        ) : (
          <Button size="sm" onClick={() => setShowKeyForm(true)}>
            <Sparkles className="h-4 w-4" /> Configurar chave Gemini
          </Button>
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Gere materiais de estudo personalizados sobre este vídeo usando IA. Os recursos ficam salvos
        na sua área pessoal.
      </p>

      {showKeyForm && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            Cole sua chave da API do Gemini (grátis em{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary-700 underline"
            >
              AI Studio
            </a>
            ). A chave é criptografada e usada apenas para gerar seus estudos.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-600"
            />
            <Button size="sm" onClick={saveKey} disabled={savingKey || !apiKey.trim()}>
              {savingKey && <Loader2 className="animate-spin" />} Salvar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            disabled={generating !== null || !hasKey}
            onClick={() => generate(type)}
          >
            {generating === type ? <Loader2 className="animate-spin" /> : <Icon className="h-4 w-4" />}
            {generating === type ? "Gerando..." : `Gerar ${label}`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="mt-5 flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" /> Carregando estudos...
        </div>
      ) : (
        <>
          {shared.length > 0 && (
            <ResourceGroup
              title="Biblioteca do vídeo"
              items={shared}
              onOpen={setOpenId}
              openId={openId}
            />
          )}
          {mine.length > 0 && (
            <ResourceGroup
              title="Meus estudos"
              items={mine}
              onOpen={setOpenId}
              openId={openId}
              onDelete={removeResource}
              onSubmit={submitToLibrary}
            />
          )}
          {resources.length === 0 && (
            <p className="mt-5 rounded-lg bg-muted/50 px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum material de estudo por aqui ainda. Escolha um tipo acima para começar.
            </p>
          )}
        </>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{videoTitle}</span>
      </p>
    </div>
  );
}

function ResourceGroup({
  title,
  items,
  onOpen,
  openId,
  onDelete,
  onSubmit,
}: {
  title: string;
  items: StudyResource[];
  onOpen: (id: string) => void;
  openId: string | null;
  onDelete?: (id: string) => void;
  onSubmit?: (id: string) => void;
}) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-2">
        {items.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => onOpen(openId === r.id ? "" : r.id)}
              className="flex w-full items-center justify-between gap-3 bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Badge variant={r.status === "PUBLICADO" ? "free" : "outline"}>{STATUS_LABEL[r.status]}</Badge>
                <span className="truncate text-sm font-medium text-foreground">{r.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {r.type === "AUDIO_RESUMO" && r.audioUrl ? (
                  <span className="flex items-center gap-1">
                    <Headphones className="h-4 w-4" /> Áudio
                  </span>
                ) : null}
                {typeof r.votes === "number" ? (
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3.5 w-3.5" /> {r.votes}
                  </span>
                ) : null}
              </span>
            </button>
            {openId === r.id && (
              <div className="border-t border-border p-4">
                <StudyResourceRenderer resource={r} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {onSubmit && r.status === "RASCUNHO" && (
                    <Button size="sm" variant="secondary" onClick={() => onSubmit(r.id)}>
                      <Send className="h-4 w-4" /> Enviar para biblioteca
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}>
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}