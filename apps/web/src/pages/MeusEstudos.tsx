import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight, Loader2, Send, Trash2, Headphones, Table, List, GraduationCap } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import type { StudyResource } from "../types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { StudyResourceRenderer } from "../components/StudyResourceRenderer";
import { MySchedule } from "./my/MySchedule";
import { CourseData } from "./my/CourseData";
import { resolveImageUrl } from "../lib/utils";
import { BackButton } from "../components/BackButton";

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em revisão",
  PUBLICADO: "Publicado",
  REJEITADO: "Rejeitado",
};

export function MeusEstudos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: "estudos" | "dados" | "grade" =
    viewParam === "grade" ? "grade" : viewParam === "dados" ? "dados" : "estudos";
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function setView(next: "estudos" | "dados" | "grade") {
    setSearchParams(next === "estudos" ? {} : { view: next }, { replace: true });
  }

  function load() {
    setLoading(true);
    api<{ data: StudyResource[] }>("/api/study/me")
      .then((d) => setResources(d.data))
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar seus estudos"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

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

  const byStatus = (status: string) => resources.filter((r) => r.status === status);
  const groups: { key: string; label: string }[] = [
    { key: "EM_REVISAO", label: "Em revisão" },
    { key: "PUBLICADO", label: "Publicados na biblioteca" },
    { key: "REJEITADO", label: "Rejeitados" },
    { key: "RASCUNHO", label: "Rascunhos" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <BackButton to="/dashboard" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <BookOpen className="h-7 w-7 text-primary-700" /> Meus estudos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Materiais que você gerou com IA, salvos direto na sua área pessoal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/catalogo">
            <Button variant="outline">Gerar novos estudos</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setView("estudos")}
          className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-medium transition-colors ${
            view === "estudos"
              ? "bg-primary-700 text-primary-foreground shadow-sm"
              : "border border-border bg-surface text-foreground hover:bg-muted"
          }`}
        >
          <List className="h-3.5 w-3.5" /> Estudos
        </button>
        <button
          type="button"
          onClick={() => setView("dados")}
          className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-medium transition-colors ${
            view === "dados"
              ? "bg-primary-700 text-primary-foreground shadow-sm"
              : "border border-border bg-surface text-foreground hover:bg-muted"
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" /> Dados do Curso
        </button>
        <button
          type="button"
          onClick={() => setView("grade")}
          className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-medium transition-colors ${
            view === "grade"
              ? "bg-primary-700 text-primary-foreground shadow-sm"
              : "border border-border bg-surface text-foreground hover:bg-muted"
          }`}
        >
          <Table className="h-3.5 w-3.5" /> Grade disciplinas
        </button>
      </div>

      {view === "grade" ? (
        <div className="mt-6">
          <MySchedule />
        </div>
      ) : view === "dados" ? (
        <div className="mt-6">
          <CourseData />
        </div>
      ) : (
        <>
          {error && (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40">
              {error}
            </p>
          )}

          {loading ? (
            <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" /> Carregando seus estudos...
            </div>
          ) : resources.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-14 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">
                Você ainda não gerou nenhum material de estudo. Abra um vídeo e use a seção "Estudar".
              </p>
              <Link to="/catalogo" className="mt-4 inline-block">
                <Button>Explorar vídeos</Button>
              </Link>
            </div>
          ) : (
            groups.map((g) => {
              const items = byStatus(g.key);
              if (items.length === 0) return null;
              return (
                <section key={g.key} className="mt-8">
                  <h2 className="mb-3 text-lg font-bold text-foreground">{g.label}</h2>
                  <div className="space-y-3">
                    {items.map((r) => (
                      <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Badge variant={r.status === "PUBLICADO" ? "free" : "outline"}>
                              {STATUS_LABEL[r.status]}
                            </Badge>
                            <span className="truncate text-sm font-medium text-foreground">{r.title}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                            {r.type === "AUDIO_RESUMO" && r.audioUrl ? (
                              <span className="flex items-center gap-1">
                                <Headphones className="h-4 w-4" /> Áudio
                              </span>
                            ) : null}
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${openId === r.id ? "rotate-90" : ""}`}
                            />
                          </div>
                        </div>
                        {r.video && (
                          <Link
                            to={`/video/${r.video.slug}`}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-primary-800 dark:hover:text-primary-300"
                          >
                            {r.video.thumbnailUrl && (
                              <img
                                src={resolveImageUrl(r.video.thumbnailUrl)}
                                alt=""
                                className="h-9 w-14 rounded-md object-cover"
                              />
                            )}
                            <span className="truncate">{r.video.title}</span>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenId(openId === r.id ? null : r.id)}
                          className="w-full px-4 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
                        >
                          {openId === r.id ? "Ocultar conteúdo" : "Ver conteúdo"}
                        </button>
                        {openId === r.id && (
                          <div className="border-t border-border p-4">
                            <StudyResourceRenderer resource={r} />
                            <div className="mt-4 flex flex-wrap gap-2">
                              {r.status === "RASCUNHO" && (
                                <Button size="sm" variant="secondary" onClick={() => submitToLibrary(r.id)}>
                                  <Send className="h-4 w-4" /> Enviar para biblioteca
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => removeResource(r.id)}>
                                <Trash2 className="h-4 w-4" /> Excluir
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
