import { useEffect, useState, useRef } from "react";
import { X, Music } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Paginated, Specialty, Tag } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { ImagePicker } from "./ImagePicker";
import { YouTubeImport } from "./YouTubeImport";
import { AudioRecorder } from "./AudioRecorder";
import { TagCreator } from "./TagCreator";
import { resolveImageUrl } from "../lib/utils";

interface ImageDraft {
  id: string;
  url: string;
  tagIds: string[];
}

interface AudioDraft {
  id: string;
  url: string;
  title: string;
}

export interface VideoFormState {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  specialtyId: string;
  difficulty: string;
  isFree: boolean;
  source: "FRONTODONTUS" | "STUDENT";
  status: string;
  author: string;
  institution: string;
  observations: string;
  audios: AudioDraft[];
  tagIds: string[];
  images: ImageDraft[];
}

export const emptyVideoForm: VideoFormState = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  specialtyId: "",
  difficulty: "BASICO",
  isFree: true,
  source: "STUDENT",
  status: "DRAFT",
  author: "",
  institution: "",
  observations: "",
  audios: [],
  tagIds: [],
  images: [],
};

interface VideoFormProps {
  initial: VideoFormState | null;
  specialties: Specialty[];
  onDone: () => void;
  onCancel: () => void;
}

export function VideoForm({ initial, specialties, onDone, onCancel }: VideoFormProps) {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [editing, setEditing] = useState<VideoFormState>(initial ?? emptyVideoForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importedVideoUrl = useRef<string | null>(null);

  useEffect(() => {
    setEditing(initial ?? emptyVideoForm);
    setError(null);
  }, [initial]);

  useEffect(() => {
    api<Paginated<Tag>>("/api/tags?perPage=50")
      .then(async (tagsPage) => {
        let allTags = tagsPage.data;
        if (tagsPage.pagination.total > allTags.length) {
          for (let p = 2; p <= tagsPage.pagination.totalPages; p++) {
            const next = await api<Paginated<Tag>>(`/api/tags?perPage=50&page=${p}`);
            allTags = [...allTags, ...next.data];
          }
        }
        setTags(allTags);
      })
      .catch(() => {});
  }, []);

  function applyYouTube(info: {
    title?: string;
    author?: string;
    thumbnailUrl?: string;
    videoUrl: string;
  }) {
    importedVideoUrl.current = info.videoUrl;
    setEditing((prev) => {
      return {
        ...prev,
        videoUrl: info.videoUrl,
        thumbnailUrl: info.thumbnailUrl ?? prev.thumbnailUrl,
        title: prev.title || info.title || "",
        author: prev.author || info.author || "",
      };
    });
  }

  function handleAudioTitleChange(index: number) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditing((prev) => ({
        ...prev,
        audios: prev.audios.map((a, i) =>
          i === index ? { ...a, title: e.target.value } : a
        ),
      }));
    };
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
      source: editing.source,
      status: editing.status,
      author: editing.author || undefined,
      institution: editing.institution || undefined,
      observations: editing.observations || undefined,
      audios: editing.audios.map((a) => ({ url: a.url, title: a.title })),
      tagIds: editing.tagIds,
      images: editing.images.map((img) => ({ url: img.url, tagIds: img.tagIds })),
    };
    try {
      if (editing.id) {
        await api(`/api/videos/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/api/videos", { method: "POST", body: JSON.stringify(body) });
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(id: string) {
    setEditing({
      ...editing,
      tagIds: editing.tagIds.includes(id)
        ? editing.tagIds.filter((t) => t !== id)
        : [...editing.tagIds, id],
    });
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

  function removeImageTag(tagId: string, imageId: string) {
    setEditing((prev) => ({
      ...prev,
      images: prev.images.map((img) =>
        img.id === imageId
          ? { ...img, tagIds: img.tagIds.filter((t) => t !== tagId) }
          : img
      ),
    }));
  }

  function canRemoveTagFromVideo(tag: Tag): boolean {
    if (editing.source === "FRONTODONTUS") return false;
    return user?.role === "ADMIN" || (tag.createdById != null && tag.createdById === user?.id);
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Informações do vídeo</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>URL do vídeo</Label>
            <Input
              value={editing.videoUrl}
              onChange={(e) => {
                const newUrl = e.target.value;
                setEditing((prev) => {
                  const wasImported = importedVideoUrl.current && prev.videoUrl === importedVideoUrl.current;
                  return {
                    ...prev,
                    videoUrl: newUrl,
                    thumbnailUrl: wasImported && newUrl !== importedVideoUrl.current ? "" : prev.thumbnailUrl,
                  };
                });
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Importar do YouTube</h3>
        <YouTubeImport
          onInfo={applyYouTube}
          videoUrl={editing.videoUrl}
/>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Music className="h-5 w-5 text-primary-600" />
            Áudios
          </h3>
        </div>
        <div className="space-y-4">
          {editing.audios.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">Áudios salvos</p>
              <div className="space-y-3">
                {editing.audios.map((audio, index) => (
                  <div
                    key={audio.id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex shrink-0 flex-col items-center gap-2 sm:flex-row sm:w-1/4">
                      <audio controls src={resolveImageUrl(audio.url)} className="h-12 min-w-0 flex-1" preload="metadata" />
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                        Áudio {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <Label>Título do áudio</Label>
                        <Input
                          value={audio.title}
                          onChange={handleAudioTitleChange(index)}
                          placeholder="Ex.: Explicação do vídeo"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            audios: prev.audios.filter((_, i) => i !== index),
                          }))
                        }
                        className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" /> Remover este áudio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <AudioRecorder
              value=""
              onChange={(audioUrl) => {
                if (audioUrl) {
                  setEditing((prev) => ({
                    ...prev,
                    audios: [...prev.audios, { id: crypto.randomUUID(), url: audioUrl, title: "" }],
                  }));
                }
              }}
              label="Adicionar novo áudio (gravar ou importar)"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Galeria de imagens</h3>
        <ImagePicker
          value={editing.images.map((img) => img.url)}
          onChange={(urls) =>
            setEditing((prev) => {
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
          <div className="mt-4 space-y-3">
            <Label>Tags de cada imagem</Label>
            <p className="text-xs text-muted-foreground">
              Tags específicas para cada imagem, independentes das tags do vídeo. Máximo de 5
              imagens.
            </p>
            {editing.images.map((img, index) => {
              const imageTags = tags.filter((tag) => img.tagIds.includes(tag.id));
              return (
                <div
                  key={img.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-start"
                >
                  <div className="flex shrink-0 flex-col items-center gap-1.5">
                    <div className="h-20 w-20 overflow-hidden rounded-lg border border-border">
                      <img src={resolveImageUrl(img.url)} alt="" className="h-full w-full object-cover" />
                    </div>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                      Imagem {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-sm font-semibold text-foreground">
                      Tags da imagem {index + 1}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {imageTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-600 px-3 py-1 text-xs font-medium text-white"
                        >
                          #{tag.name}
{canRemoveTagFromVideo(tag) && (
                        <button
                          type="button"
                          onClick={() => removeImageTag(tag.id, img.id)}
                          className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-white transition-colors hover:bg-white/40"
                          title="Remover tag da imagem"
                          aria-label={`Remover tag ${tag.name} da imagem`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                        </span>
                      ))}
                      {imageTags.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma tag nesta imagem ainda.</p>
                      )}
                    </div>
                    <TagCreator onCreate={(name) => createImageTag(name, img.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Detalhes</h3>
        <div className="grid gap-4 md:grid-cols-2">
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

        <div className="mt-4 space-y-2">
          <Label>Descrição</Label>
          <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
        </div>

        <div className="mt-4 space-y-2">
          <Label>Observações pessoais</Label>
          <Textarea value={editing.observations} onChange={(e) => setEditing({ ...editing, observations: e.target.value })} rows={3} placeholder="Anotações privadas sobre este conteúdo..." />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">Acesso, origem e tags</h3>

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

        <div className="mt-4 flex items-center gap-4">
          <Label>Origem do vídeo</Label>
          <Select
            value={editing.source}
            onChange={(e) =>
              setEditing({ ...editing, source: e.target.value as "FRONTODONTUS" | "STUDENT" })
            }
          >
            <option value="STUDENT">Estudante</option>
            <option value="FRONTODONTUS">FrontOdontus</option>
          </Select>
          <p className="text-xs text-muted-foreground">
            Marque como "Estudante" para separar dos vídeos do administrador.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Tags</Label>
          <div className="mb-2">
            <Input
              placeholder="Buscar tag pelo nome..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags
              .filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()))
              .map((tag) => {
                const selected = editing.tagIds.includes(tag.id);
                const canRemove = canRemoveTagFromVideo(tag);
                return (
                  <span
                    key={tag.id}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "bg-primary-700 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={selected ? "text-white" : "text-muted-foreground hover:text-foreground"}
                      title={selected ? "Remover tag do vídeo" : "Adicionar tag ao vídeo"}
                    >
                      #{tag.name}
                    </button>
                    {selected && canRemove && (
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                          selected
                            ? "bg-white/25 text-white hover:bg-white/40"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-red-600"
                        }`}
                        title="Remover tag do vídeo"
                        aria-label={`Remover tag ${tag.name} do vídeo`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
          </div>
          <TagCreator onCreate={createTag} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button onClick={save} disabled={saving || !editing.title || !editing.videoUrl}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}