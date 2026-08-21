import { useRef, useState } from "react";
import { Camera, Trash2, RotateCcw, Video } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";

interface VideoRecorderProps {
  onRecorded: (url: string) => void;
  onRemoved: () => void;
}

export function VideoRecorder({ onRecorded, onRemoved }: VideoRecorderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"idle" | "preview" | "uploading" | "done">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCamera() {
    setError(null);
    inputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setPreviewUrl(url);
    setPhase("preview");
    e.target.value = "";
  }

  async function uploadAndConfirm() {
    if (!recordedBlob) return;
    setPhase("uploading");
    try {
      const ext = recordedBlob.type.includes("mp4") ? ".mp4" : ".webm";
      const form = new FormData();
      form.append("image", recordedBlob, `gravacao-aula${ext}`);
      const uploadRes = await api<{ data: { url: string } }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      setUploadedUrl(uploadRes.data.url);
      onRecorded(uploadRes.data.url);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setRecordedBlob(null);
      setPreviewUrl(null);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload do video");
      setPhase("preview");
    }
  }

  function discard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
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

      {/* Hidden file input: opens native camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Preview of recorded video */}
      {phase === "preview" && previewUrl && (
        <div className="rounded-xl border border-border overflow-hidden">
          <video controls src={previewUrl} className="w-full" preload="metadata" playsInline />
        </div>
      )}

      {/* Uploaded video (done) */}
      {phase === "done" && uploadedUrl && (
        <div className="rounded-xl border border-border overflow-hidden">
          <video controls src={uploadedUrl} className="w-full" preload="metadata" />
        </div>
      )}

      {/* Uploading spinner */}
      {phase === "uploading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 p-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Enviando video...</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {phase === "idle" && (
          <Button type="button" variant="outline" size="sm" onClick={openCamera}>
            <Camera className="h-3.5 w-3.5" /> Gravar aula
          </Button>
        )}

        {phase === "preview" && (
          <>
            <Button type="button" variant="default" size="sm" onClick={uploadAndConfirm}>
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
