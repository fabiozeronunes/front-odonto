import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, Tag, Video } from "../../types";
import { VideoCard } from "../../components/VideoCard";
import { VideoForm, emptyVideoForm, type VideoFormState } from "../../components/VideoForm";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { resolveImageUrl } from "../../lib/utils";

interface RelatedData {
  videos: Video[];
  images: {
    id: string;
    url: string;
    alt?: string | null;
    tags: { tag: Tag }[];
    caseStudy: { id: string; title: string; slug: string };
  }[];
}

export function MyVideos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoFormState | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [relatedMap, setRelatedMap] = useState<Record<string, RelatedData>>({});
  const [loadingRelated, setLoadingRelated] = useState<string | null>(null);

  const editingId = searchParams.get("edit");

  async function load() {
    setLoading(true);
    try {
      const [v, s] = await Promise.all([
        api<Paginated<Video>>("/api/videos/me?perPage=50"),
        api<{ data: Specialty[] }>("/api/specialties"),
      ]);
      setVideos(v.data);
      setSpecialties(s.data);

      if (editingId) {
        const found = v.data.find((vid) => vid.id === editingId);
        if (found) {
          startEdit(found);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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

  async function toggleRelated(videoId: string) {
    if (expandedVideo === videoId) {
      setExpandedVideo(null);
      return;
    }
    setExpandedVideo(videoId);
    if (relatedMap[videoId]) return;
    setLoadingRelated(videoId);
    try {
      const data = await api<RelatedData>(`/api/videos/${videoId}/related`);
      setRelatedMap((prev) => ({ ...prev, [videoId]: data }));
    } catch {
      /* ignore */
    } finally {
      setLoadingRelated(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Meus vídeos</h2>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" /> Novo vídeo
        </Button>
      </div>

      {editing && (
        <Card className="mt-5 border-primary-200">
          <CardContent className="space-y-5 pt-6">
            <VideoForm
              initial={editing}
              specialties={specialties}
              onDone={() => {
                setEditingAndUrl(null);
                load();
              }}
              onCancel={() => setEditingAndUrl(null)}
            />
          </CardContent>
        </Card>
      )}

      <Card className="mt-5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Título</th>
                  <th className="px-5 py-3">Especialidade</th>
                  <th className="px-5 py-3">Acesso</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                ) : videos.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Nenhum vídeo cadastrado ainda.</td></tr>
                ) : (
                  videos.map((v) => (
                    <>
                      <tr key={v.id} className="hover:bg-muted">
                        <td className="max-w-[280px] px-5 py-3">
                          <p className="truncate font-medium text-foreground" onClick={() => navigate(`/video/${v.slug}`)} title="Assistir vídeo">{v.title}</p>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{v.specialty?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          <Badge variant={v.isFree ? "free" : "premium"}>{v.isFree ? "FREE" : "Pago"}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={v.status === "PUBLISHED" ? "default" : "outline"}>{v.status}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleRelated(v.id)} title="Ver vídeos e imagens relacionados">
                              {expandedVideo === v.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => togglePublish(v)} title={v.status === "PUBLISHED" ? "Despublicar" : "Publicar"}>
                              {v.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => startEdit(v)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(v.id)} className="text-red-600" title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedVideo === v.id && (
                        <tr key={`${v.id}-related`}>
                          <td colSpan={5} className="bg-muted px-5 py-4">
                            {loadingRelated === v.id ? (
                              <p className="py-4 text-center text-sm text-muted-foreground">Carregando relacionados...</p>
                            ) : (
                              (() => {
                                const rel = relatedMap[v.id];
                                if (!rel || (rel.videos.length === 0 && rel.images.length === 0)) {
                                  return (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                      Nenhum vídeo ou imagem relacionada. Vincule este vídeo a um estudo de caso
                                      para ver relacionados.
                                    </p>
                                  );
                                }
                                return (
                                  <div className="space-y-5">
                                    {rel.videos.length > 0 && (
                                      <div>
                                        <h4 className="mb-3 text-sm font-bold text-foreground">Vídeos relacionados</h4>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                          {rel.videos.map((rv) => (
                                            <VideoCard key={rv.id} video={rv} />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {rel.images.length > 0 && (
                                      <div>
                                        <h4 className="mb-3 text-sm font-bold text-foreground">Imagens relacionadas</h4>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                          {rel.images.map((img) => (
                                            <div
                                              key={img.id}
                                              className="overflow-hidden rounded-xl border border-border bg-surface"
                                            >
                                              <img
                                                src={resolveImageUrl(img.url)}
                                                alt={img.alt ?? img.caseStudy.title}
                                                className="aspect-video w-full object-cover"
                                              />
                                              <div className="space-y-1 p-2">
                                                <p className="truncate text-xs font-medium text-foreground">
                                                  {img.caseStudy.title}
                                                </p>
                                                <div className="flex flex-wrap gap-1">
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
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}