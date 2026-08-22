import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Plus, Video as VideoIcon, Eye, EyeOff, Pencil, Trash2, Clock, Flame } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, Video } from "../../types";
import { VideoForm, emptyVideoForm, type VideoFormState } from "../../components/VideoForm";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";

export function MyVideos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoFormState | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get("search") ?? "";
  const specialty = searchParams.get("specialty") ?? "";
  const status = searchParams.get("status") ?? "";
  const access = searchParams.get("access") ?? "";
  const sort = searchParams.get("sort") ?? "recent";

  const filterKey = [search, specialty, status, access, sort].join("|");

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("perPage", "50");
      if (search) params.set("search", search);
      if (specialty) params.set("specialty", specialty);
      if (status) params.set("status", status);
      if (access) params.set("isFree", access === "gratuito" ? "true" : "false");
      if (sort) params.set("sort", sort);

      const [v, s] = await Promise.all([
        api<Paginated<Video>>(`/api/videos/me?${params.toString()}`),
        api<{ data: Specialty[] }>("/api/specialties"),
      ]);
      setVideos(v.data);
      setSpecialties(s.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterKey]);

  function setEditingAndUrl(state: VideoFormState | null) {
    setEditing(state);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (state?.id) {
        next.set("edit", state.id);
      } else {
        next.delete("edit");
      }
      return next;
    }, { replace: true });
  }

  function startCreate() {
    setEditingAndUrl({ ...emptyVideoForm, status: "DRAFT" });
  }

  function startEdit(video: Video) {
    setEditingAndUrl({
      id: video.id,
      title: video.title,
      description: video.description ?? "",
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl ?? "",
      specialtyId: video.specialty?.id ?? "",
      difficulty: video.difficulty,
      isFree: video.isFree,
      source: video.source ?? "STUDENT",
      status: video.status,
      author: video.author ?? "",
      institution: video.institution ?? "",
      observations: video.observations ?? "",
      audios: video.audios?.map((a) => ({ id: a.id, url: a.url, title: a.title ?? "", createdAt: a.createdAt })) ?? [],
      tagIds: video.tags.map((t) => t.tag.id),
      images: video.images?.slice(0, 5).map((i) => ({
        id: i.id,
        url: i.url,
        tagIds: i.tags?.map((t) => t.tag.id) ?? [],
      })) ?? [],
    });
  }

  async function remove(id: string) {
    if (!confirm("Excluir este vídeo?")) return;
    await api(`/api/videos/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(video: Video) {
    await api(`/api/videos/${video.id}/${video.status === "PUBLISHED" ? "unpublish" : "publish"}`, {
      method: "POST",
    });
    load();
  }

  const editingId = searchParams.get("edit");
  useEffect(() => {
    if (editingId && videos.length > 0) {
      const found = videos.find((vid) => vid.id === editingId);
      if (found && !editing) {
        startEdit(found);
      }
    }
  }, [editingId, videos]);

  const activeFilterCount = [specialty, status, access].filter(Boolean).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Meus vídeos</h2>
        <Button onClick={startCreate}><Plus className="h-4 w-4" /> Novo vídeo</Button>
      </div>

      {editing && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
          <Button variant="ghost" size="sm" onClick={() => setEditingAndUrl(null)} className="mb-4">
            <X className="h-4 w-4" /> Fechar formulário
          </Button>
          <VideoForm
            initial={editing}
            specialties={specialties}
            onDone={() => {
              setEditingAndUrl(null);
              load();
            }}
            onCancel={() => setEditingAndUrl(null)}
          />
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Status:
          </span>
          <button
            type="button"
            onClick={() => updateParam("status", status === "PUBLISHED" ? "" : "PUBLISHED")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
              status === "PUBLISHED"
                ? "bg-primary-700 text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${status === "PUBLISHED" ? "bg-surface" : "bg-primary-600"}`} />
            Publicados
          </button>
          <button
            type="button"
            onClick={() => updateParam("status", status === "DRAFT" ? "" : "DRAFT")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
              status === "DRAFT"
                ? "bg-amber-600 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${status === "DRAFT" ? "bg-surface" : "bg-amber-500"}`} />
            Rascunhos
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="mr-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Acesso:
          </span>
          <button
            type="button"
            onClick={() => updateParam("access", access === "gratuito" ? "" : "gratuito")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
              access === "gratuito"
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${access === "gratuito" ? "bg-surface" : "bg-emerald-500"}`} />
            Gratuito
          </button>
          <button
            type="button"
            onClick={() => updateParam("access", access === "pago" ? "" : "pago")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
              access === "pago"
                ? "bg-violet-600 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${access === "pago" ? "bg-surface" : "bg-violet-500"}`} />
            Pago
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="mr-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Ordenar:
          </span>
          <button
            type="button"
            onClick={() => updateParam("sort", "recent")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
              sort === "recent"
                ? "bg-primary-700 text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <Clock className="h-4 w-4" />
            Mais recentes
          </button>
          <button
            type="button"
            onClick={() => updateParam("sort", "oldest")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors ${
              sort === "oldest"
                ? "bg-accent-600 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <Flame className="h-4 w-4" />
            Mais antigos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={search}
              placeholder="Buscar seus vídeos..."
              className="pl-9"
              onChange={(e) => updateParam("search", e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1">{activeFilterCount}</Badge>
              )}
            </Button>
            {(search || activeFilterCount > 0) && (
              <Button variant="ghost" onClick={() => setSearchParams((prev) => {
                const tab = prev.get("tab");
                const next = new URLSearchParams();
                if (tab) next.set("tab", tab);
                return next;
              })}>
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select value={specialty} onChange={(e) => updateParam("specialty", e.target.value)}>
              <option value="">Todas especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => updateParam("status", e.target.value)}>
              <option value="">Todos status</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Rascunho</option>
            </Select>
            <Select value={access} onChange={(e) => updateParam("access", e.target.value)}>
              <option value="">Todos acessos</option>
              <option value="gratuito">Gratuito</option>
              <option value="pago">Pago</option>
            </Select>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Filtros ativos:
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSearchParams((prev) => {
            const tab = prev.get("tab");
            const next = new URLSearchParams();
            if (tab) next.set("tab", tab);
            return next;
          })}>
            Limpar filtros
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-left text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Especialidade</th>
                <th className="px-5 py-3">Acesso</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              ) : videos.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center py-6">
                    <VideoIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm">Nenhum vídeo encontrado.</p>
                    <Button onClick={startCreate} className="mt-3" size="sm">
                      <Plus className="h-4 w-4" /> Criar primeiro vídeo
                    </Button>
                  </div>
                </td></tr>
              ) : (
                videos.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                    <td className="max-w-[280px] px-5 py-3">
                      <p className="truncate font-medium text-foreground">{v.title}</p>
                      <p className="text-xs text-muted-foreground">{v.author ?? "—"}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{v.specialty?.name ?? "—"}</td>
                    <td className="px-5 py-3"><Badge variant={v.isFree ? "free" : "premium"}>{v.isFree ? "FREE" : "Pago"}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={v.status === "PUBLISHED" ? "default" : "outline"}>{v.status}</Badge></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => togglePublish(v)} title={v.status === "PUBLISHED" ? "Despublicar" : "Publicar"}>
                          {v.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(v)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(v.id)} className="text-red-600" title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
