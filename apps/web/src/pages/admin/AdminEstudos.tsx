import { useEffect, useState } from "react";
import { Check, ChevronRight, Loader2, X, BookOpen } from "lucide-react";
import { api, ApiRequestError } from "../../lib/api";
import type { Paginated, StudyResource } from "../../types";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { StudyResourceRenderer } from "../../components/StudyResourceRenderer";

const STATUS_LABEL: Record<string, string> = {
  EM_REVISAO: "Em revisão",
  PUBLICADO: "Publicado",
  REJEITADO: "Rejeitado",
  RASCUNHO: "Rascunho",
};

export function AdminEstudos() {
  const [data, setData] = useState<Paginated<StudyResource>>({ data: [], pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 } });
  const [status, setStatus] = useState("EM_REVISAO");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function load(page = 1) {
    setLoading(true);
    api<Paginated<StudyResource>>(`/api/admin/study?status=${status}&page=${page}&perPage=10`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar biblioteca"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function review(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    try {
      await api(`/api/admin/study/${id}/${action}`, { method: "POST" });
      setData((d) => ({
        ...d,
        data: d.data.filter((r) => r.id !== id),
        pagination: { ...d.pagination, total: d.pagination.total - 1 },
      }));
      if (openId === id) setOpenId(null);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Erro ao revisar recurso");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen className="h-6 w-6 text-primary-700" /> Biblioteca de estudos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recursos gerados pelos alunos. Revise e aprove antes de publicar na biblioteca compartilhada.
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {(["EM_REVISAO", "PUBLICADO", "REJEITADO"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatus(s);
                setOpenId(null);
              }}
              className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                status === s ? "bg-primary-700 text-primary-foreground" : "bg-surface text-muted-foreground hover:bg-muted"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40">{error}</p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" /> Carregando...
        </div>
      ) : data.data.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-14 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhum recurso {STATUS_LABEL[status].toLowerCase()}.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {data.data.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge variant="outline">{r.type.replace("_", " ")}</Badge>
                  <span className="truncate text-sm font-medium text-foreground">{r.title}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.video?.title} • {r.author?.name ?? r.author?.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
              >
                {openId === r.id ? "Ocultar conteúdo" : "Ver conteúdo"}
                <ChevronRight className={`h-4 w-4 transition-transform ${openId === r.id ? "rotate-90" : ""}`} />
              </button>
              {openId === r.id && (
                <div className="border-t border-border p-4">
                  <StudyResourceRenderer resource={r} />
                  {status === "EM_REVISAO" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="premium" disabled={busy === r.id} onClick={() => review(r.id, "approve")}>
                        {busy === r.id ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />} Aprovar
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => review(r.id, "reject")}>
                        <X className="h-4 w-4" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}