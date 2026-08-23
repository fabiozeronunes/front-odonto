import { useRef, useState } from "react";
import { Camera, Trash2, RotateCcw, Video, Loader2, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VideoRecorderProps {
  onRecorded: (url: string, title: string) => void;
  onRemoved: () => void;
}

export function VideoRecorder({ onRecorded, onRemoved }: VideoRecorderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"idle" | "preview" | "uploading" | "done">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMeta, setRecordedMeta] = useState<{ date: string; dayWeek: string; hour: string } | null>(null);
  const [title, setTitle] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  function openCamera() {
    setError(null);
    inputRef.current?.click();
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function formatDayWeek(d: Date) {
    return d.toLocaleDateString("pt-BR", { weekday: "long" });
  }

  function formatHour(d: Date) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const now = new Date();
    setRecordedBlob(file);
    setPreviewUrl(url);
    setRecordedMeta({
      date: formatDate(now),
      dayWeek: formatDayWeek(now),
      hour: formatHour(now),
    });
    setTitle(`Aula ${formatDate(now)} ${formatHour(now)}`);
    setPhase("preview");
    e.target.value = "";
  }

  async function uploadAndConfirm() {
    if (!recordedBlob) return;
    setPhase("uploading");
    setUploadProgress("Preparando...");
    try {
      const ext = recordedBlob.type.includes("mp4") ? ".mp4" : ".webm";

      setUploadProgress("Gerando link de upload...");
      const signedRes = await api<{ data: { signedUrl: string; publicUrl: string } }>("/api/uploads/signed-url", {
        method: "POST",
        body: JSON.stringify({ filename: `gravacao${ext}`, contentType: recordedBlob.type }),
      });
      const { signedUrl, publicUrl } = signedRes.data;

      setUploadProgress(`Enviando vídeo (${Math.round(recordedBlob.size / 1024 / 1024)}MB)...`);
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": recordedBlob.type },
        body: recordedBlob,
      });
      if (!uploadRes.ok) throw new Error("Falha ao enviar vídeo");

      setUploadedUrl(publicUrl);
      onRecorded(publicUrl, title);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setRecordedBlob(null);
      setPreviewUrl(null);
      setRecordedMeta(null);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
      setPhase("preview");
    } finally {
      setUploadProgress("");
    }
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordedMeta(null);
    setTitle("");
    setPhase("idle");
  }

  function removeUploaded() {
    setUploadedUrl(null);
    setPhase("idle");
    onRemoved();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />

      {phase === "preview" && previewUrl && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border overflow-hidden">
            <video controls src={previewUrl} className="w-full" preload="metadata" playsInline />
          </div>
          {recordedMeta && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5">{recordedMeta.dayWeek}</span>
              <span className="rounded-full bg-muted px-2 py-0.5">{recordedMeta.date}</span>
              <span className="rounded-full bg-muted px-2 py-0.5">{recordedMeta.hour}</span>
            </div>
          )}
          <div className="space-y-1">
            <Label>Título do vídeo</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Aula sobre endodontia" />
          </div>
        </div>
      )}

      {phase === "done" && uploadedUrl && (
        <div className="rounded-xl border border-border overflow-hidden">
          <video controls src={uploadedUrl} className="w-full" preload="metadata" />
        </div>
      )}

      {phase === "uploading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 p-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{uploadProgress || "Enviando..."}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {phase === "idle" && (
          <Button type="button" variant="outline" size="sm" onClick={openCamera}>
            <Camera className="h-3.5 w-3.5" /> Gravar aula
          </Button>
        )}

        {phase === "preview" && (
          <>
            <Button type="button" size="sm" onClick={uploadAndConfirm} disabled={!title.trim()}>
              <Video className="h-3.5 w-3.5" /> Enviar e usar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={discard}>
              <RotateCcw className="h-3.5 w-3.5" /> Descartar
            </Button>
          </>
        )}

        {phase === "done" && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={openCamera}>
              <Camera className="h-3.5 w-3.5" /> Gravar outra
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={removeUploaded} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
