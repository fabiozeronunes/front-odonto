import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, Video } from "../../types";
import { VideoForm, emptyVideoForm, type VideoFormState } from "../../components/VideoForm";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { InfoPopover } from "../../components/ui/info-popover";

export function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoFormState | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [v, s] = await Promise.all([
        api<Paginated<Video>>(`/api/videos?perPage=15&page=${page}&all=true`),
        api<{ data: Specialty[] }>("/api/specialties?all=true"),
      ]);
      setVideos(v.data);
      setTotalPages(v.pagination.totalPages);
      setSpecialties(s.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  function startCreate() {
    setEditing({ ...emptyVideoForm, source: "FRONTODONTUS", status: "DRAFT" });
  }

  function startEdit(video: Video) {
    setEditing({
      id: video.id,
      title: video.title,
      description: video.description ?? "",
      videoUrl: video.videoUrl,
      recordedUrl: video.recordedUrl ?? "",
      recordedTitle: video.recordedTitle ?? "",
      recordedDate: video.recordedDate ?? "",
      recordedTime: video.recordedTime ?? "",
      recordedOrientation: video.recordedOrientation ?? "16:9",
      recordedDisciplina: video.recordedDisciplina ?? "",
      recordedCurso: video.recordedCurso ?? "",
      disciplina: video.disciplina ?? "",
      curso: video.curso ?? "",
      thumbnailUrl: video.thumbnailUrl ?? "",
      specialtyId: video.specialty?.id ?? "",
      difficulty: video.difficulty,
      isFree: video.isFree,
      source: video.source ?? "FRONTODONTUS",
      status: video.status,
      author: video.author ?? "",
      institution: video.institution ?? "",
      observations: video.observations ?? "",
      audios: video.audios?.map((a) => ({ id: a.id, url: a.url, title: a.title ?? "", disciplina: a.disciplina ?? "", curso: a.curso ?? "" })) ?? [],
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            Vídeos
            <InfoPopover
              title="Como usar"
              text="Cadastre e edite os vídeos do catálogo. Pode informar URL (YouTube/Vimeo) ou fazer upload de arquivo. Associe a uma especialidade e a tags para aparecer na busca. Vídeos marcados como 'pago' exigem plano de assinatura para assistir."
            />
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gerenciar conteúdos da plataforma</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" /> Novo vídeo
        </Button>
      </div>

      {editing && (
        <Card className="mt-6 border-primary-200">
          <CardHeader>
            <CardTitle>{editing.id ? "Editar vídeo" : "Novo vídeo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoForm
              initial={editing}
              specialties={specialties}
              onDone={() => {
                setEditing(null);
                load();
              }}
              onCancel={() => setEditing(null)}
            />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conteúdos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Título</th>
                  <th className="px-5 py-3">Especialidade</th>
                  <th className="px-5 py-3">Acesso</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">Carregando...</td>
                  </tr>
                ) : (
                  videos.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="max-w-[280px] px-5 py-3">
                        <p className="truncate font-medium text-slate-800">{v.title}</p>
                        <p className="text-xs text-slate-400">{v.author ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{v.specialty?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge variant={v.isFree ? "free" : "premium"}>
                          {v.isFree ? "FREE" : "PREMIUM"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={v.status === "PUBLISHED" ? "default" : "outline"}>
                          {v.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => togglePublish(v)} title={v.status === "PUBLISHED" ? "Despublicar" : "Publicar"}>
                            {v.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(v.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Anterior
        </Button>
        <span className="text-sm text-slate-500">Página {page} de {Math.max(totalPages, 1)}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
