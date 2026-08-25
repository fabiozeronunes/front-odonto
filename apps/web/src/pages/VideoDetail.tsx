import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, Eye, Clock, User, Building2, Calendar, Tag as TagIcon, X, PlayCircle, Video as VideoIcon } from "lucide-react";
import { AudioPlayer } from "../components/AudioPlayer";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { VideoDetail } from "../types";
import { VideoCard } from "../components/VideoCard";
import { MediaBadges } from "../components/MediaBadges";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { StudySection } from "../components/StudySection";
import { formatDate, formatDuration, resolveImageUrl, cn } from "../lib/utils";
import { BackButton } from "../components/BackButton";

function hasPremiumAccess(user: { role?: string; plan?: { slug: string } } | null) {
  return user?.role === "ADMIN" || (!!user?.plan && user.plan.slug !== "gratuito");
}

export function VideoDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
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

  useEffect(() => {
    setLoading(true);
    api<VideoDetail>(`/api/videos/${slug}`)
      .then((d) => {
        setData(d);
        if (!authLoading) {
          setIsPremiumLocked(!d.video.isFree && !hasPremiumAccess(user));
        }
      })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar vídeo"))
      .finally(() => setLoading(false));
  }, [slug, isAuthenticated, user, authLoading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Erro</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link to="/catalogo?type=cases" className="inline-block">
            <Button variant="outline">Voltar ao catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { video, related } = data;

  async function toggleFavorite() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/video/${video.slug}` } });
      return;
    }
    const result = await api<{ favorited: boolean }>(`/api/videos/${video.id}/favorite`, {
      method: "POST",
    });
    setFavorited(result.favorited);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <BackButton to="/catalogo" label="Voltar ao catálogo" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Badge variant="info" className="rounded-full bg-gradient-to-r from-teal-500 to-amber-500 px-3 py-1 text-white">
          <VideoIcon className="mr-1 h-3.5 w-3.5" /> VÍDEO
        </Badge>
      </div>

      {isPremiumLocked ? (
        <div className="flex flex-col items-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-20 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
          <span className="mb-4 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">CONTEÚDO PREMIUM</span>
          <h1 className="text-2xl font-bold text-foreground">{video.title}</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            {isAuthenticated
              ? "Você não tem permissão para assistir este conteúdo. Assine o plano Premium para desbloquear todos os vídeos exclusivos."
              : "Este vídeo é exclusivo para membros premium. Faça login ou assine o plano Premium para desbloquear."}
          </p>
          <div className="mt-6 flex gap-3">
            {isAuthenticated ? (
              <Link to="/planos">
                <Button variant="premium">Assinar Premium</Button>
              </Link>
            ) : (
              <>
                <Link to="/planos">
                  <Button variant="premium">Assinar Premium</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline">Fazer login</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="aspect-video bg-gradient-to-br from-teal-500 to-amber-500">
            <iframe
              src={video.videoUrl}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              {video.isFree ? (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
                  GRATUITO
                </span>
              ) : (
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
                  PREMIUM
                </span>
              )}
              <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
                {video.difficulty.toLowerCase()}
              </span>
              {video.specialty && (
                <Link to={`/catalogo?specialty=${video.specialty.slug}`}>
                  <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 transition-colors hover:bg-accent-100 dark:bg-accent-900 dark:text-accent-200 dark:hover:bg-accent-800">
                    {video.specialty.name}
                  </span>
                </Link>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{video.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {video.durationSeconds ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {formatDuration(video.durationSeconds)}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> {video.viewCount} visualizações
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatDate(video.publishedAt)}
              </span>
              {video.author && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {video.author}
                </span>
              )}
              {video.institution && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> {video.institution}
                </span>
              )}
            </div>

            {video.description && (
              <p className="mt-5 whitespace-pre-line text-muted-foreground">{video.description}</p>
            )}

            <div className="mt-6 flex gap-3 border-t border-border pt-5">
              <Button
                variant="premium"
                className="rounded-full"
                onClick={toggleFavorite}
              >
                <Heart className={favorited ? "fill-red-500 text-red-500" : ""} />
                {favorited ? "Favoritado" : "Favoritar"}
              </Button>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await api(`/api/videos/${video.id}/watch`, { method: "POST" });
                  }}
                >
                  Registrar visualização
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {video.audios && video.audios.length > 0 && (
        <section className="mt-10">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="mb-5 text-xl font-bold text-foreground flex items-center gap-2">
              <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              Áudios
            </h2>
            <div className="space-y-4">
              {video.audios.map((audio) => (
                <div
                  key={audio.id}
                  className="rounded-xl border border-border p-4"
                >
                  <AudioPlayer src={audio.url} label={audio.title || undefined} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {video.images && video.images.length > 0 && (
        <section className="mt-10">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground">Imagens relacionadas</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Imagens por linha:</span>
                <div className="inline-flex overflow-hidden rounded-lg border border-border">
                  {(["1", "2"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeRows(value)}
                      className={cn(
                        "px-3 py-1 font-semibold transition-colors",
                        rows === value
                          ? "bg-gradient-to-r from-teal-500 to-amber-500 text-white"
                          : "bg-surface text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "grid gap-3 sm:gap-4",
                rows === "2"
                  ? "grid-cols-2 md:grid-cols-3"
                  : "mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              )}
            >
              {video.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightbox(img.url)}
                  className="group overflow-hidden rounded-xl border border-border bg-surface text-left"
                  title="Ampliar imagem"
                >
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.alt ?? video.title}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {img.tags && img.tags.length > 0 && (
                    <span className="flex flex-wrap gap-1 p-2">
                      {img.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {video.tags && video.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                {video.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    to={`/catalogo?tag=${tag.slug}`}
                    className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 transition-colors hover:bg-accent-100 dark:bg-accent-900 dark:text-accent-200 dark:hover:bg-accent-800"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Fechar imagem"
          >
            <X className="h-6 w-6" />
          </button>
          <img src={resolveImageUrl(lightbox)} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}

      {data.relatedCaseStudies && data.relatedCaseStudies.length > 0 && (
        <section className="mt-10">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground">Estudos de caso relacionados</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Casos por linha:</span>
                <div className="inline-flex overflow-hidden rounded-lg border border-border">
                  {(["1", "2"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => changeRows(value)}
                      className={cn(
                        "px-3 py-1 font-semibold transition-colors",
                        rows === value
                          ? "bg-gradient-to-r from-teal-500 to-amber-500 text-white"
                          : "bg-surface text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "grid gap-4 sm:gap-6",
                rows === "2"
                  ? "grid-cols-2 md:grid-cols-4"
                  : "mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              )}
            >
              {data.relatedCaseStudies.map((cs) => {
                const caseVideo = cs.videoCases?.[0]?.video;
                return (
                  <Link
                    key={cs.id}
                    to={`/casos/${cs.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {caseVideo?.thumbnailUrl ? (
                        <img
                          src={resolveImageUrl(caseVideo.thumbnailUrl)}
                          alt={caseVideo.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 to-teal-600">
                          <PlayCircle className="h-10 w-10 text-white/80" />
                        </div>
                      )}
                      <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
                        {cs.isFree ? (
                          <Badge variant="free" className="rounded-md bg-gradient-to-r from-teal-500 to-amber-500 px-1.5 py-0.5 text-[9px] uppercase leading-none text-white sm:px-2 sm:py-1 sm:text-[11px]">
                            GRATUITO
                          </Badge>
                        ) : (
                          <Badge variant="premium" className="rounded-md px-1.5 py-0.5 text-[9px] uppercase leading-none sm:px-2 sm:py-1 sm:text-[11px]">
                            PREMIUM
                          </Badge>
                        )}
                        <Badge variant="info" className="rounded-md px-1.5 py-0.5 text-[9px] uppercase leading-none sm:px-2 sm:py-1 sm:text-[11px]">
                          Estudo de caso
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">
                        {cs.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{cs.difficulty.toLowerCase()}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                        <MediaBadges caseStudy={cs} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {isAuthenticated && !isPremiumLocked && <StudySection videoId={video.id} videoTitle={video.title} />}

      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-foreground">Vídeos relacionados</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Vídeos por linha:</span>
              <div className="inline-flex overflow-hidden rounded-lg border border-border">
                {(["1", "2"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeRows(value)}
                    className={cn(
                      "px-3 py-1 font-semibold transition-colors",
                      rows === value
                        ? "bg-gradient-to-r from-teal-500 to-amber-500 text-white"
                        : "bg-surface text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              rows === "2"
                ? "grid-cols-2 md:grid-cols-4"
                : "mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            )}
          >
            {related.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </div>
        </section>
      )}

      {data.relatedImages && data.relatedImages.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-foreground">Imagens relacionadas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.relatedImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(img.url)}
                className="group overflow-hidden rounded-xl border border-border text-left"
                title="Ampliar imagem"
              >
                <img
                  src={resolveImageUrl(img.url)}
                  alt={img.alt ?? video.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="flex flex-wrap gap-1 p-2">
                  {img.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
