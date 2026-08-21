import { useEffect, useRef, useState } from "react";
import { Camera, Pause, Play, Square, RotateCcw, Video } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";

interface VideoRecorderProps {
  onRecorded: (url: string) => void;
}

export function VideoRecorder({ onRecorded }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"idle" | "preview" | "recording" | "paused" | "review" | "uploading">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function startPreview() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setPhase("preview");
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stopStream();
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setPhase("review");
    };

    recorderRef.current = recorder;
    recorder.start();
    setPhase("recording");
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function togglePause() {
    const r = recorderRef.current;
    if (!r) return;
    if (r.state === "recording") {
      r.pause();
      setPhase("paused");
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else if (r.state === "paused") {
      r.resume();
      setPhase("recording");
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (!r || r.state === "inactive") return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    r.stop();
  }

  function discard() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setPreviewUrl(null);
    setElapsed(0);
    setPhase("idle");
  }

  async function uploadAndConfirm() {
    if (!recordedUrl) return;
    setPhase("uploading");
    try {
      const res = await fetch(recordedUrl);
      const blob = await res.blob();
      const form = new FormData();
      form.append("image", blob, "gravacao-aula.webm");
      const uploadRes = await api<{ data: { url: string } }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      setPreviewUrl(uploadRes.data.url);
      onRecorded(uploadRes.data.url);
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
      setElapsed(0);
      setPhase("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload do vídeo");
      setPhase("review");
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Preview of already recorded + uploaded video */}
      {previewUrl && phase === "idle" && (
        <div className="rounded-xl border border-border overflow-hidden">
          <video controls src={previewUrl} className="w-full" preload="metadata" />
        </div>
      )}

      {/* Camera view */}
      {phase !== "idle" && phase !== "uploading" && (
        <div className="rounded-xl border border-border overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full"
            playsInline
            muted={phase === "recording" || phase === "paused"}
            src={phase === "review" && recordedUrl ? recordedUrl : undefined}
            controls={phase === "review"}
          />
        </div>
      )}

      {phase === "uploading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 p-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Enviando vídeo...</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {phase === "idle" && (
          <Button type="button" variant="outline" size="sm" onClick={startPreview}>
            <Camera className="h-3.5 w-3.5" /> Abrir câmera
          </Button>
        )}

        {phase === "preview" && (
          <>
            <Button type="button" variant="default" size="sm" onClick={startRecording}>
              <Video className="h-3.5 w-3.5" /> Iniciar gravação
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { stopStream(); setPhase("idle"); }}>
              Cancelar
            </Button>
          </>
        )}

        {(phase === "recording" || phase === "paused") && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={togglePause}>
              {phase === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {phase === "paused" ? "Continuar" : "Pausar"}
            </Button>
            <Button type="button" variant="default" size="sm" onClick={stopRecording}>
              <Square className="h-3.5 w-3.5" /> Parar
            </Button>
          </>
        )}

        {phase === "review" && (
          <>
            <Button type="button" variant="default" size="sm" onClick={uploadAndConfirm}>
              Enviar e usar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={discard}>
              <RotateCcw className="h-3.5 w-3.5" /> Gravar novamente
            </Button>
          </>
        )}

        {(phase === "recording" || phase === "paused") && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {fmt(elapsed)}
          </span>
        )}
      </div>
    </div>
  );
}
