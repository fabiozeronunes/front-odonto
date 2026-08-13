import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { api } from "../../lib/api";
import type { Paginated, Specialty, Tag, Video } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

interface VideoFormState {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  specialtyId: string;
  difficulty: string;
  isFree: boolean;
  status: string;
  author: string;
  institution: string;
  tagIds: string[];
}

const emptyForm: VideoFormState = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  specialtyId: "",
  difficulty: "BASICO",
  isFree: true,
  status: "DRAFT",
  author: "",
  institution: "",
  tagIds: [],
};

export function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [v, s, t] = await Promise.all([
        api<Paginated<Video>>(`/api/videos?perPage=15&page=${page}&all=true`),
        api<{ data: Specialty[] }>("/api/specialties?all=true"),
        api<{ data: Tag[] }>("/api/tags?all=true"),
      ]);
      setVideos(v.data);
      setTotalPages(v.pagination.totalPages);
      setSpecialties(s.data);
      setTags(t.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  function startCreate() {
    setEditing(emptyForm);
    setError(null);
  }

  function startEdit(video: Video) {
    setEditing({
      id: video.id,
      title: video.title,
      description: video.description ?? "",
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl ?? "",
      specialtyId: video.specialty?.id ?? "",
      difficulty: video.difficulty,
      isFree: video.isFree,
      status: video.status,
      author: video.author ?? "",
      institution: video.institution ?? "",
      tagIds: video.tags.map((t) => t.tag.id),
    });
    setError(null);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const body = {
      title: editing.title,
      description: editing.description || undefined,
      videoUrl: editing.videoUrl,
      thumbnailUrl: editing.thumbnailUrl || undefined,
      specialtyId: editing.specialtyId || null,
      difficulty: editing.difficulty,
      isFree: editing.isFree,
      status: editing.status,
      author: editing.author || undefined,
      institution: editing.institution || undefined,
      tagIds: editing.tagIds,
    };
    try {
      if (editing.id) {
        await api(`/api/videos/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/videos", { method: "POST", body: JSON.stringify(body) });
      }
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
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

  function toggleTag(id: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      tagIds: editing.tagIds.includes(id)
        ? editing.tagIds.filter((t) => t !== id)
        : [...editing.tagIds, id],
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vídeos</h1>
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
          <CardContent className="space-y-4">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL do vídeo *</Label>
                <Input
                  value={editing.videoUrl}
                  onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL</Label>
                <Input
                  value={editing.thumbnailUrl}
                  onChange={(e) => setEditing({ ...editing, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select
                  value={editing.specialtyId}
                  onChange={(e) => setEditing({ ...editing, specialtyId: e.target.value })}
                >
                  <option value="">Sem especialidade</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de dificuldade</Label>
                <Select
                  value={editing.difficulty}
                  onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
                >
                  <option value="BASICO">Básico</option>
                  <option value="INTERMEDIARIO">Intermediário</option>
                  <option value="AVANCADO">Avançado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Arquivado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autor</Label>
                <Input
                  value={editing.author}
                  onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input
                  value={editing.institution}
                  onChange={(e) => setEditing({ ...editing, institution: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-4">
              <Label>Tipo de acesso</Label>
              <Select
                value={editing.isFree ? "gratuito" : "pago"}
                onChange={(e) => setEditing({ ...editing, isFree: e.target.value === "gratuito" })}
              >
                <option value="gratuito">Gratuito</option>
                <option value="pago">Pago</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      editing.tagIds.includes(tag.id)
                        ? "bg-primary-700 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving || !editing.title || !editing.videoUrl}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
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
