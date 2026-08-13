import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../../lib/api";
import type { CaseStudy, Paginated, Specialty, Tag, Video } from "../../types";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { ImagePicker } from "../../components/ImagePicker";
import { YouTubeImport } from "../../components/YouTubeImport";
import { AudioRecorder } from "../../components/AudioRecorder";
import { TagCreator } from "../../components/TagCreator";
import { resolveImageUrl } from "../../lib/utils";

interface ImageDraft {
  id: string;
  url: string;
  tagIds: string[];
}

interface CaseFormState {
  id?: string;
  title: string;
  description: string;
  diagnosis: string;
  specialtyId: string;
  difficulty: string;
  isFree: boolean;
  status: string;
  author: string;
  institution: string;
  observations: string;
  audioUrl: string;
  tagIds: string[];
  videoIds: string[];
  images: ImageDraft[];
}

const emptyForm: CaseFormState = {
  title: "",
  description: "",
  diagnosis: "",
  specialtyId: "",
  difficulty: "BASICO",
  isFree: true,
  status: "DRAFT",
  author: "",
  institution: "",
  observations: "",
  audioUrl: "",
  tagIds: [],
  videoIds: [],
  images: [],
};

export function MyCases() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [c, s, tagsPage, v] = await Promise.all([
        api<Paginated<CaseStudy>>("/api/case-studies/me?perPage=50"),
        api<{ data: Specialty[] }>("/api/specialties"),
        api<Paginated<Tag>>("/api/tags?perPage=50"),
        api<Paginated<Video>>("/api/videos/me?perPage=50"),
      ]);
      let allTags = tagsPage.data;
      if (tagsPage.pagination.total > allTags.length) {
        for (let p = 2; p <= tagsPage.pagination.totalPages; p++) {
          const next = await api<Paginated<Tag>>(`/api/tags?perPage=50&page=${p}`);
          allTags = [...allTags, ...next.data];
        }
      }
      setCases(c.data);
      setSpecialties(s.data);
      setTags(allTags);
      setMyVideos(v.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing({ ...emptyForm });
    setError(null);
  }

  function startEdit(c: CaseStudy) {
    setEditing({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      diagnosis: c.diagnosis ?? "",
      specialtyId: c.specialty?.id ?? "",
      difficulty: c.difficulty,
      isFree: c.isFree,
      status: c.status,
      author: c.author ?? "",
      institution: c.institution ?? "",
      observations: c.observations ?? "",
      audioUrl: c.audioUrl ?? "",
      tagIds: c.tags.map((t) => t.tag.id),
      videoIds: c.videoCases?.map((vc) => vc.video.id) ?? c.videoIds ?? [],
      images: c.images?.slice(0, 5).map((i) => ({
        id: i.id,
        url: i.url,
        tagIds: i.tags?.map((t) => t.tag.id) ?? [],
      })) ?? [],
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
      diagnosis: editing.diagnosis || undefined,
      specialtyId: editing.specialtyId || null,
      difficulty: editing.difficulty,
      isFree: editing.isFree,
      status: editing.status,
      author: editing.author || undefined,
      institution: editing.institution || undefined,
      observations: editing.observations || undefined,
      audioUrl: editing.audioUrl || undefined,
      tagIds: editing.tagIds,
      videoIds: editing.videoIds,
      images: editing.images.map((img) => ({ url: img.url, tagIds: img.tagIds })),
    };
    try {
      if (editing.id) {
        await api(`/api/case-studies/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/case-studies", { method: "POST", body: JSON.stringify(body) });
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
    if (!confirm("Excluir este estudo de caso?")) return;
    await api(`/api/case-studies/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(c: CaseStudy) {
    await api(`/api/case-studies/${c.id}/${c.status === "PUBLISHED" ? "unpublish" : "publish"}`, {
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

  function toggleVideo(id: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      videoIds: editing.videoIds.includes(id)
        ? editing.videoIds.filter((t) => t !== id)
        : [...editing.videoIds, id],
    });
  }

  async function importYouTubeVideo(info: {
    title?: string;
    author?: string;
    thumbnailUrl?: string;
    videoUrl: string;
  }) {
    if (!editing) return;
    setError(null);
    try {
      const res = await api<{ data: Video }>("/api/videos", {
        method: "POST",
        body: JSON.stringify({
          title: info.title || "Vídeo importado",
          videoUrl: info.videoUrl,
          thumbnailUrl: info.thumbnailUrl || undefined,
          author: info.author || undefined,
          isFree: true,
          status: "DRAFT",
        }),
      });
      setMyVideos((prev) =>
        prev.some((v) => v.id === res.data.id)
          ? prev
          : [res.data, ...prev]
      );
      setEditing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          videoIds: prev.videoIds.includes(res.data.id)
            ? prev.videoIds
            : [...prev.videoIds, res.data.id],
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao importar vídeo");
    }
  }

  async function createTag(name: string) {
    if (!editing || !name.trim()) return null;
    const trimmed = name.trim();
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!editing.tagIds.includes(existing.id)) {
        setEditing({ ...editing, tagIds: [...editing.tagIds, existing.id] });
      }
      return existing.id;
    }
    try {
      const res = await api<{ data: Tag }>("/api/tags", {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      setTags((prev) => [...prev.filter((t) => t.id !== res.data.id), res.data]);
      setEditing({ ...editing, tagIds: [...editing.tagIds, res.data.id] });
      return res.data.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar tag");
      return null;
    }
  }

  async function createImageTag(name: string, imageId: string) {
    if (!editing || !name.trim()) return null;
    const trimmed = name.trim();
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    let tagId = existing?.id;
    if (!tagId) {
      try {
        const res = await api<{ data: Tag }>("/api/tags", {
          method: "POST",
          body: JSON.stringify({ name: trimmed }),
        });
        tagId = res.data.id;
        setTags((prev) => [...prev.filter((t) => t.id !== res.data.id), res.data]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao criar tag");
        return null;
      }
    }
    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        images: prev.images.map((img) =>
          img.id === imageId && !img.tagIds.includes(tagId!)
            ? { ...img, tagIds: [...img.tagIds, tagId!] }
            : img
        ),
      };
    });
    return tagId;
  }

  async function deleteTag(tagId: string) {
    if (!editing) return;
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    if (!confirm(`Excluir a tag #${tag.name} definitivamente? Ela será removida de todos os conteúdos.`)) return;
    try {
      await api(`/api/tags/${tagId}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setEditing((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tagIds: prev.tagIds.filter((t) => t !== tagId),
          images: prev.images.map((img) => ({
            ...img,
            tagIds: img.tagIds.filter((t) => t !== tagId),
          })),
        };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir tag");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Meus estudos de caso</h2>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" /> Novo caso
        </Button>
      </div>

      {editing && (
        <Card className="mt-5 border-primary-200">
          <CardContent className="space-y-4 pt-6">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={editing.specialtyId} onChange={(e) => setEditing({ ...editing, specialtyId: e.target.value })}>
                  <option value="">Sem especialidade</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nível de dificuldade</Label>
                <Select value={editing.difficulty} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}>
                  <option value="BASICO">Básico</option>
                  <option value="INTERMEDIARIO">Intermediário</option>
                  <option value="AVANCADO">Avançado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Arquivado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autor</Label>
                <Input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <Input value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vídeos do caso</Label>
              <p className="text-xs text-slate-500">
                Importe um vídeo do YouTube ou selecione um ou mais vídeos seus para vincular a este
                estudo de caso.
              </p>
              <YouTubeImport onInfo={importYouTubeVideo} />
              <div className="flex flex-wrap gap-2 pt-2">
                {myVideos.map((v) => {
                  const selected = editing.videoIds.includes(v.id);
                  return (
                    <span
                      key={v.id}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary-700 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleVideo(v.id)}
                        className={selected ? "text-white" : "text-slate-600 hover:text-slate-900"}
                        title={selected ? "Remover vídeo do caso" : "Adicionar vídeo ao caso"}
                      >
                        {v.title}
                      </button>
                    </span>
                  );
                })}
                {myVideos.length === 0 && (
                  <p className="text-sm text-slate-400">
                    Nenhum vídeo seu ainda. Use a importação do YouTube acima para criar o primeiro.
                  </p>
                )}
              </div>
            </div>

            <AudioRecorder
              value={editing.audioUrl}
              onChange={(audioUrl) => setEditing({ ...editing, audioUrl })}
              label="Áudio (gravar ou importar)"
            />

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Diagnóstico / Evolução</Label>
              <Textarea value={editing.diagnosis} onChange={(e) => setEditing({ ...editing, diagnosis: e.target.value })} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Observações pessoais</Label>
              <Textarea value={editing.observations} onChange={(e) => setEditing({ ...editing, observations: e.target.value })} rows={3} placeholder="Anotações privadas sobre este caso..." />
            </div>

            <ImagePicker
              value={editing.images.map((img) => img.url)}
              onChange={(urls) =>
                setEditing((prev) => {
                  if (!prev) return prev;
                  const used = new Set<string>();
                  return {
                    ...prev,
                    images: urls
                      .map((url) => {
                        const existing = prev.images.find(
                          (img) => img.url === url && !used.has(img.id)
                        );
                        if (existing) {
                          used.add(existing.id);
                          return existing;
                        }
                        return { id: crypto.randomUUID(), url, tagIds: [] };
                      })
                      .slice(0, 5),
                  };
                })
              }
              label="Galeria de imagens (upload ou link, máx. 5)"
            />

            {editing.images.length > 0 && (
              <div className="space-y-3">
                <Label>Tags de cada imagem</Label>
                <p className="text-xs text-slate-500">
                  Tags específicas para cada imagem, independentes das tags do caso. Máximo de 5
                  imagens.
                </p>
                {editing.images.map((img, index) => {
                  const imageTags = tags.filter((tag) => img.tagIds.includes(tag.id));
                  return (
                    <div
                      key={img.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-start"
                    >
                      <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <div className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                          <img src={resolveImageUrl(img.url)} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                          Imagem {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="mb-2 text-sm font-semibold text-slate-700">
                          Tags da imagem {index + 1}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {imageTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 rounded-full bg-accent-600 px-3 py-1 text-xs font-medium text-white"
                            >
                              #{tag.name}
                              <button
                                type="button"
                                onClick={() => deleteTag(tag.id)}
                                className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/40"
                                title="Excluir tag"
                                aria-label={`Excluir tag ${tag.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {imageTags.length === 0 && (
                            <p className="text-sm text-slate-400">Nenhuma tag nesta imagem ainda.</p>
                          )}
                        </div>
                        <TagCreator onCreate={(name) => createImageTag(name, img.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
                {tags.map((tag) => {
                  const selected = editing.tagIds.includes(tag.id);
                  return (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary-700 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={selected ? "text-white" : "text-slate-600 hover:text-slate-900"}
                        title={selected ? "Remover tag do caso" : "Adicionar tag ao caso"}
                      >
                        #{tag.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTag(tag.id)}
                        className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                          selected
                            ? "bg-white/25 text-white hover:bg-white/40"
                            : "text-slate-400 hover:bg-slate-200 hover:text-red-600"
                        }`}
                        title="Excluir tag"
                        aria-label={`Excluir tag ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
              <TagCreator onCreate={createTag} />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={save} disabled={saving || !editing.title}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-5">
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
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Carregando...</td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Nenhum estudo de caso cadastrado ainda.</td></tr>
                ) : (
                  cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="max-w-[280px] px-5 py-3">
                        <p className="truncate font-medium text-slate-800">{c.title}</p>
                        <p className="text-xs text-slate-400">{c.author ?? "—"} {c.observations ? "• com observações" : ""}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{c.specialty?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge variant={c.isFree ? "free" : "premium"}>{c.isFree ? "FREE" : "Pago"}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={c.status === "PUBLISHED" ? "default" : "outline"}>{c.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => togglePublish(c)} title={c.status === "PUBLISHED" ? "Despublicar" : "Publicar"}>
                            {c.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="text-red-600" title="Excluir">
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
    </div>
  );
}