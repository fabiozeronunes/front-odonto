import { useRef, useState } from "react";
import { Camera, Trash2, RotateCcw, Video, Loader2, Upload } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Orientation = "16:9" | "9:16";

interface VideoRecorderProps {
  onRecorded: (url: string, title: string, orientation?: string) => void;
  onRemoved: () => void;
}

export function VideoRecorder({ onRecorded, onRemoved }: VideoRecorderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"idle" | "preview" | "uploading" | "done">("idle");
  const [orientation, setOrientation] = useState<Orientation>("16:9");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMeta, setRecordedMeta] = useState<{ date: string; dayWeek: string; hour: string } | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  function openCamera() {
    setError(null);
    cameraInputRef.current?.click();
  }

  function openUpload() {
    setError(null);
    uploadInputRef.current?.click();
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

  function detectOrientation(file: File): Promise<Orientation> {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        resolve(v.videoHeight > v.videoWidth ? "9:16" : "16:9");
        URL.revokeObjectURL(v.src);
      };
      v.onerror = () => resolve("16:9");
      v.src = URL.createObjectURL(file);
    });
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const detected = await detectOrientation(file);
    setOrientation(detected);
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

  async function uploadToYouTube() {
    if (!recordedBlob) return;
    setPhase("uploading");
    setUploadProgress("Obtendo token...");
    try {
      const tokenRes = await api<{ data: { accessToken: string } }>("/api/youtube/token");
      const accessToken = tokenRes.data.accessToken;

      const metadata = {
        snippet: {
          title,
          description: `Aula gravada em ${recordedMeta?.date} ${recordedMeta?.hour}`,
          categoryId: "27",
        },
        status: {
          privacyStatus: "unlisted",
          selfDeclaredMadeForKids: false,
        },
      };

      setUploadProgress("Iniciando upload no YouTube...");
      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": recordedBlob.type,
            "X-Upload-Content-Length": String(recordedBlob.size),
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!initRes.ok) {
        throw new Error(`Falha ao iniciar upload: ${initRes.status} ${await initRes.text()}`);
      }

      const uploadUrl = initRes.headers.get("Location");
      if (!uploadUrl) throw new Error("URL de upload não encontrada");

      setUploadProgress(`Enviando vídeo (${Math.round(recordedBlob.size / 1024 / 1024)}MB)...`);
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": recordedBlob.type },
        body: recordedBlob,
      });

      if (!uploadRes.ok) throw new Error(`Falha no upload: ${uploadRes.status}`);

      const uploadData = await uploadRes.json();
      const videoId = uploadData.id;
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      onRecorded(embedUrl, title, orientation);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setRecordedBlob(null);
      setPreviewUrl(null);
      setRecordedMeta(null);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload para YouTube");
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
        ref={cameraInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onFileSelected}
      />

      {phase === "idle" && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Orientação:</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-border">
              {(["16:9", "9:16"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    orientation === o
                      ? "bg-primary-700 text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {o === "16:9" ? "Horizontal 16:9" : "Vertical 9:16"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openCamera}>
              <Camera className="h-3.5 w-3.5" /> Gravar aula
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openUpload}>
              <Upload className="h-3.5 w-3.5" /> Enviar vídeo
            </Button>
          </div>
        </div>
      )}

      {phase === "preview" && previewUrl && (
        <div className="space-y-3">
          <div
            className={`mx-auto overflow-hidden rounded-xl border border-border ${
              orientation === "9:16" ? "aspect-[9/16] max-w-[280px]" : "aspect-video w-full"
            }`}
          >
            <video controls src={previewUrl} className="h-full w-full object-contain" preload="metadata" playsInline />
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

      {phase === "uploading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 p-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{uploadProgress || "Enviando..."}</span>
        </div>
      )}

      {phase === "preview" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={uploadToYouTube} disabled={!title.trim()}>
            <Video className="h-3.5 w-3.5" /> Enviar e usar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={discard}>
            <RotateCcw className="h-3.5 w-3.5" /> Descartar
          </Button>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openCamera}>
            <Camera className="h-3.5 w-3.5" /> Gravar outra
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openUpload}>
            <Upload className="h-3.5 w-3.5" /> Enviar outro
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={removeUploaded} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      )}
    </div>
  );
}