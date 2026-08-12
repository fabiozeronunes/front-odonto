import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Image as ImageIcon } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, Specialty, Tag, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { resolveImageUrl } from "../lib/utils";

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
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";
  const specialty = searchParams.get("specialty") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const imageTag = searchParams.get("imageTag") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const access = searchParams.get("access") ?? "";
  const sort = searchParams.get("sort") ?? "recent";

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
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", "12");
    params.set("sort", sort);
    if (search) params.set("search", search);
    if (specialty) params.set("specialty", specialty);
    if (tag) params.set("tag", tag);
    if (imageTag) params.set("imageTag", imageTag);
    if (difficulty) params.set("difficulty", difficulty);
    if (access) params.set("isFree", access === "gratuito" ? "true" : "false");

    api<Paginated<Video>>(`/api/videos?${params.toString()}`)
      .then((data) => {
        setVideos(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page, search, specialty, tag, imageTag, difficulty, access, sort]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  const activeFilterCount = [specialty, tag, imageTag, difficulty, access].filter(Boolean).length;

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
        <h1 className="text-3xl font-bold text-slate-900">Catálogo de vídeos e imagens</h1>
        <p className="mt-1 text-slate-500">
          {imageTag
            ? `${matchingImages.length} ${matchingImages.length === 1 ? "imagem" : "imagens"} com a tag ${selectedImageTag ? `#${selectedImageTag.name}` : ""}`
            : searchImages.length > 0
              ? `${total} vídeos e ${searchImages.length} ${searchImages.length === 1 ? "imagem" : "imagens"} encontrada${searchImages.length === 1 ? "" : "s"} para "${search}"`
              : `${total} conteúdos disponíveis`}
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-6">
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
          <span className="text-sm text-slate-500">Filtros ativos:</span>
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            Limpar filtros
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : imageTag ? (
        matchingImages.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <ImageIcon className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Nenhuma imagem encontrada</h3>
            <p className="mt-1 text-sm text-slate-500">
              Nenhum vídeo tem imagens com essa tag. Tente outra tag de imagem.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {matchingImages.map(({ img, video }) => (
                <Link
                  key={`${video.id}-${img.id}`}
                  to={`/video/${video.slug}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="overflow-hidden">
                    <img
                      src={resolveImageUrl(img.url)}
                      alt={video.title}
                      className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-slate-800">{video.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(img.tags ?? []).map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam("page", String(page - 1))}
              >
                Anterior
              </Button>
              <Badge variant="outline">
                Página {page} de {Math.max(totalPages, 1)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParam("page", String(page + 1))}
              >
                Próxima
              </Button>
            </div>
          </>
        )
      ) : videos.length === 0 && searchImages.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Search className="h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Nenhum conteúdo encontrado</h3>
          <p className="mt-1 text-sm text-slate-500">
            Tente ajustar os filtros ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <>
          {searchImages.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Imagens encontradas ({searchImages.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {searchImages.map((img) => (
                  <Link
                    key={img.id}
                    to={`/video/${img.video.slug}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-lift"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={resolveImageUrl(img.url)}
                        alt={img.video.title}
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-slate-800">{img.video.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {img.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700"
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParam("page", String(page - 1))}
                >
                  Anterior
                </Button>
                <Badge variant="outline">
                  Página {page} de {Math.max(totalPages, 1)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParam("page", String(page + 1))}
                >
                  Próxima
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
