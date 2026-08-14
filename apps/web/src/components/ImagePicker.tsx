import { useRef, useState } from "react";
import { Check, FolderOpen, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn, resolveImageUrl } from "../lib/utils";

interface ImagePickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

interface UploadImage {
  url: string;
  name: string;
}

export function ImagePicker({ value, onChange, label = "Imagens" }: ImagePickerProps) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<UploadImage[] | null>(null);
  const [loadingMine, setLoadingMine] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await api<{ data: { url: string } }>("/api/uploads", { method: "POST", body: form });
      onChange([...value, res.data.url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function loadMine() {
    if (mine) {
      setShowMine((s) => !s);
      return;
    }
    setLoadingMine(true);
    setError(null);
    try {
      const res = await api<{ data: UploadImage[] }>("/api/uploads/mine");
      setMine(res.data);
      setShowMine(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao listar uploads");
    } finally {
      setLoadingMine(false);
    }
  }

  function toggleFromMine(img: UploadImage) {
    if (value.includes(img.url)) {
      onChange(value.filter((u) => u !== img.url));
    } else {
      onChange([...value, img.url]);
    }
  }

  function addUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//.test(trimmed)) {
      setError("Informe uma URL válida (https://...)");
      return;
    }
    onChange([...value, trimmed]);
    setUrl("");
    setError(null);
  }

  function remove(target: string) {
    onChange(value.filter((u) => u !== target));
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {value.map((u) => (
          <div key={u} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
            <img src={resolveImageUrl(u)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(u)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover imagem"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-600">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="mt-1 text-[10px]">{uploading ? "Enviando..." : "Upload"}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://link-da-imagem.com/imagem.jpg"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
        />
        <Button type="button" variant="outline" size="sm" onClick={addUrl}>
          <Link2 className="h-4 w-4" /> Adicionar link
        </Button>
      </div>

      <div>
        <Button type="button" variant="ghost" size="sm" onClick={loadMine} disabled={loadingMine}>
          {loadingMine ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
          {showMine ? "Ocultar meus uploads" : "Selecionar dos meus uploads"}
        </Button>
        {showMine && (
          <div className="mt-2">
            {mine && mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">Você ainda não enviou imagens.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mine?.map((img) => {
                  const selected = value.includes(img.url);
                  return (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => toggleFromMine(img)}
                      title={selected ? "Remover seleção" : "Selecionar"}
                      className={cn(
                        "relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all",
                        selected ? "border-primary-600 ring-2 ring-primary-200" : "border-transparent hover:border-border"
                      )}
                    >
                      <img src={resolveImageUrl(img.url)} alt="" className="h-full w-full object-cover" />
                      {selected && (
                        <span className="absolute bottom-1 right-1 rounded-full bg-primary-600 p-0.5 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}