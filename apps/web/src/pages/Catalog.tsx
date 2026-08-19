import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Image as ImageIcon, Clock, Flame, Video as VideoIcon } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, Specialty, Tag, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { resolveImageUrl, cn } from "../lib/utils";

interface ImageSearchItem {
  id: string;
  url: string;
  tags: { tag: Tag }[];
  video: { id: string; title: string; slug: string };
}

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [imageTags, setImageTags] = useState<Tag[]>([]);
  const [searchImages, setSearchImages] = useState<ImageSearchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const isLoadMoreRef = useRef(false);
  const [rows, setRows] = useState<"1" | "2">(() => {
    try {
      return localStorage.getItem("odonto_catalog_rows") === "1" ? "1" : "2";
    } catch {
      return "2";
    }
  });

  function changeRows(value: "1" | "2") {
    setRows(value);
    try {
      localStorage.setItem("odonto_catalog_rows", value);
    } catch {
      /* ignore */
    }
  }

  const search = searchParams.get("search") ?? "";
  const specialty = searchParams.get("specialty") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const imageTag = searchParams.get("imageTag") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const access = searchParams.get("access") ?? "";
  const source = searchParams.get("source") ?? "";
  const sort = searchParams.get("sort") ?? "recent";

  const filterKey = [search, specialty, tag, imageTag, difficulty, access, source, sort].join("|");

  useEffect(() => {
    setVisibleCount(8);
  }, [filterKey]);

  useEffect(() => {
    (async () => {
      const [specs, tagList, imgTags] = await Promise.all([
        api<{ data: Specialty[] }>("/api/specialties"),
        api<Paginated<Tag>>("/api/tags?perPage=100"),
        api<{ data: Tag[] }>("/api/videos/image-tags"),
      ]);
      setSpecialties(specs.data);
      setTags(tagList.data);
      setImageTags(imgTags.data);
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchImages([]);
      return;
    }
    api<{ data: ImageSearchItem[] }>(
      `/api/videos/images?tag=${encodeURIComponent(search.trim())}`
    )
      .then((d) => setSearchImages(d.data))
      .catch(() => setSearchImages([]));
  }, [search]);

  useEffect(() => {
    const isLoadMore = isLoadMoreRef.current;
    isLoadMoreRef.current = false;
    if (!isLoadMore) setLoading(true);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("perPage", String(visibleCount));
    params.set("sort", sort);
    if (search) params.set("search", search);
    if (specialty) params.set("specialty", specialty);
    if (tag) params.set("tag", tag);
    if (imageTag) params.set("imageTag", imageTag);
    if (difficulty) params.set("difficulty", difficulty);
    if (access) params.set("isFree", access === "gratuito" ? "true" : "false");
    if (source) params.set("source", source);

    api<Paginated<Video>>(`/api/videos?${params.toString()}`)
      .then((data) => {
        setVideos(data.data);
        setTotal(data.pagination.total);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [filterKey, visibleCount]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function loadMore() {
    if (loadingMore) return;
    isLoadMoreRef.current = true;
    setLoadingMore(true);
    setVisibleCount((c) => c + 8);
  }

  const activeFilterCount = [specialty, tag, imageTag, difficulty, access].filter(Boolean).length;

  const gridClass =
    rows === "2"
      ? "grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4"
      : "mx-auto max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3";

  const matchingImages = videos.flatMap((video) =>
    (video.images ?? [])
      .filter((img) =>
        (img.tags ?? []).some((t) => t.tag.slug === imageTag || t.tag.id === imageTag)
      )
      .map((img) => ({ img, video }))
  );

  const selectedImageTag = imageTags.find((t) => t.slug === imageTag || t.id === imageTag);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Catálogo de vídeos e imagens</h1>
        <p className="mt-1 text-muted-foreground">
          {imageTag
            ? `${matchingImages.length} ${matchingImages.length === 1 ? "imagem" : "imagens"} com a tag ${selectedImageTag ? `#${selectedImageTag.name}` : ""}`
            : searchImages.length > 0
              ? `${total} vídeos e ${searchImages.length} ${searchImages.length === 1 ? "imagem" : "imagens"} encontrada${searchImages.length === 1 ? "" : "s"} para "${search}"`
              : `${total} conteúdos disponíveis`}
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-foreground">Conteúdo:</span>
          <button
            type="button"
            onClick={() =>
              updateParam("source", source === "FRONTODONTUS" ? "" : "FRONTODONTUS")
            }
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
              source === "FRONTODONTUS"
                ? "bg-primary-700 text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${source === "FRONTODONTUS" ? "bg-surface" : "bg-primary-600"}`}
            />
            FrontOdontus
          </button>
          <button
            type="button"
            onClick={() => updateParam("source", source === "STUDENT" ? "" : "STUDENT")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
              source === "STUDENT"
                ? "bg-sky-700 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${source === "STUDENT" ? "bg-surface" : "bg-sky-500"}`}
            />
            Estudante
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="mr-1 text-sm font-semibold text-foreground">Ordenar:</span>
          <button
            type="button"
            onClick={() => updateParam("sort", "recent")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
              sort === "recent"
                ? "bg-primary-700 text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <Clock className="h-4 w-4" />
            Vídeos novos
          </button>
          <button
            type="button"
            onClick={() => updateParam("sort", "popular")}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
              sort === "popular"
                ? "bg-accent-600 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <Flame className="h-4 w-4" />
            Mais assistidos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="mr-1 text-sm font-semibold text-foreground">Vídeos por linha:</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(["1", "2"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => changeRows(value)}
                className={cn(
                  "px-4 py-1.5 font-semibold transition-colors",
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={search}
              placeholder="Buscar..."
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
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-6">
            <Select value={specialty} onChange={(e) => updateParam("specialty", e.target.value)}>
              <option value="">Todas especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select value={tag} onChange={(e) => updateParam("tag", e.target.value)}>
              <option value="">Todas as tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.slug}>
                  #{t.name}
                </option>
              ))}
            </Select>
            <Select value={imageTag} onChange={(e) => updateParam("imageTag", e.target.value)}>
              <option value="">Tag da imagem</option>
              {imageTags.map((t) => (
                <option key={t.id} value={t.slug}>
                  #{t.name}
                </option>
              ))}
            </Select>
            <Select value={difficulty} onChange={(e) => updateParam("difficulty", e.target.value)}>
              <option value="">Todos níveis</option>
              <option value="BASICO">Básico</option>
              <option value="INTERMEDIARIO">Intermediário</option>
              <option value="AVANCADO">Avançado</option>
            </Select>
            <Select value={access} onChange={(e) => updateParam("access", e.target.value)}>
              <option value="">Todos acessos</option>
              <option value="gratuito">Gratuito</option>
              <option value="premium">Premium</option>
            </Select>
            <Select value={sort} onChange={(e) => updateParam("sort", e.target.value)}>
              <option value="recent">Mais recentes</option>
              <option value="popular">Mais populares</option>
              <option value="oldest">Mais antigos</option>
            </Select>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            Limpar filtros
          </Button>
        </div>
      )}

      {loading ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : imageTag ? (
        matchingImages.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhuma imagem encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nenhum vídeo tem imagens com essa tag. Tente outra tag de imagem.
            </p>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {matchingImages.map(({ img, video }) => (
                <Link
                  key={`${video.id}-${img.id}`}
                  to={`/video/${video.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="overflow-hidden">
                    <img
                      src={resolveImageUrl(img.url)}
                      alt={video.title}
                      className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-foreground">{video.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(img.tags ?? []).map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {videos.length < total && (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Carregando..." : "Carregar mais vídeos"}
                </Button>
              </div>
            )}
          </>
        )
      ) : videos.length === 0 && searchImages.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Search className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum conteúdo encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente ajustar os filtros ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <>
          {searchImages.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-foreground">
                Imagens encontradas ({searchImages.length})
              </h2>
              <div className={gridClass}>
                {searchImages.map((img) => (
                  <Link
                    key={img.id}
                    to={`/video/${img.video.slug}`}
                    className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={resolveImageUrl(img.url)}
                        alt={img.video.title}
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-foreground">{img.video.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {img.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {videos.length > 0 && (
            <>
              <div className={gridClass}>
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} typeIcon={<VideoIcon className="h-3 w-3" />} />
                ))}
              </div>
              {videos.length < total && (
                <div className="mt-10 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Carregando..." : "Carregar mais vídeos"}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
