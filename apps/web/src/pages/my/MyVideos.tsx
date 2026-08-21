import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Plus, Video as VideoIcon, Clock, Flame } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, Video } from "../../types";
import { VideoCard } from "../../components/VideoCard";
import { VideoForm, emptyVideoForm, type VideoFormState } from "../../components/VideoForm";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

export function MyVideos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoFormState | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [rows, setRows] = useState<"1" | "2">(() => {
    try {
      return localStorage.getItem("odonto_myvideos_rows") === "1" ? "1" : "2";
    } catch {
      return "2";
    }
  });

  const search = searchParams.get("search") ?? "";
  const specialty = searchParams.get("specialty") ?? "";
  const status = searchParams.get("status") ?? "";
  const access = searchParams.get("access") ?? "";
  const sort = searchParams.get("sort") ?? "recent";

  const filterKey = [search, specialty, status, access, sort].join("|");

  function changeRows(value: "1" | "2") {
    setRows(value);
    try {
      localStorage.setItem("odonto_myvideos_rows", value);
    } catch {
      /* ignore */
    }
  }

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
      setTotal(v.pagination.total);
      setSpecialties(s.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterKey]);

  useEffect(() => {
    setVisibleCount(8);
  }, [filterKey]);

  function setEditingAndUrl(state: VideoFormState | null) {
    setEditing(state);
    if (state?.id) {
      setSearchParams({ edit: state.id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
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

  const gridClass =
    rows === "2"
      ? "grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4"
      : "mx-auto max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3";

  return (
    <div>
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
            <span
              className={`h-2 w-2 rounded-full ${status === "PUBLISHED" ? "bg-surface" : "bg-primary-600"}`}
            />
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
            <span
              className={`h-2 w-2 rounded-full ${status === "DRAFT" ? "bg-surface" : "bg-amber-500"}`}
            />
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
            <span
              className={`h-2 w-2 rounded-full ${access === "gratuito" ? "bg-surface" : "bg-emerald-500"}`}
            />
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
            <span
              className={`h-2 w-2 rounded-full ${access === "pago" ? "bg-surface" : "bg-violet-500"}`}
            />
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
          <span className="mr-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Vídeos por linha:
          </span>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(["1", "2"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => changeRows(value)}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-medium uppercase tracking-wide transition-colors",
                  rows === value
                    ? "bg-primary-700 text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:bg-muted"
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="ml-1 text-xs text-muted-foreground">
            {rows === "1" ? "1 por linha no celular · 2 no tablet" : "2 por linha no celular · 4 no tablet"}
          </span>
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
              <Button variant="ghost" onClick={() => setSearchParams({})}>
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
            <Button onClick={startCreate}>
              <Plus className="h-4 w-4" /> Novo vídeo
            </Button>
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
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            Limpar filtros
          </Button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${total} vídeos encontrados`}
        </p>
      </div>

      {loading ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <VideoIcon className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum vídeo encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || activeFilterCount > 0
              ? "Tente ajustar os filtros ou buscar por outro termo."
              : "Você ainda não cadastrou nenhum vídeo."}
          </p>
          {!search && activeFilterCount === 0 && (
            <Button onClick={startCreate} className="mt-4">
              <Plus className="h-4 w-4" /> Criar primeiro vídeo
            </Button>
          )}
        </div>
      ) : (
        <div className={gridClass}>
          {videos.slice(0, visibleCount).map((video) => (
            <div key={video.id} className="group relative">
              <VideoCard video={video} />
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-surface/90 backdrop-blur"
                  onClick={() => togglePublish(video)}
                  title={video.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                >
                  {video.status === "PUBLISHED" ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-surface/90 backdrop-blur"
                  onClick={() => startEdit(video)}
                  title="Editar"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-surface/90 backdrop-blur text-red-600 hover:text-red-700"
                  onClick={() => remove(video.id)}
                  title="Excluir"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && videos.length > visibleCount && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + 8)}>
            Carregar mais vídeos
          </Button>
        </div>
      )}
    </div>
  );
}
