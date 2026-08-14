import { useEffect, useRef, useState } from "react";
import { AudioLines, Mic, Pause, Play, Square, Trash2, Upload } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { cn, resolveImageUrl } from "../lib/utils";

interface AudioRecorderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function AudioRecorder({
  value,
  onChange,
  label = "Áudio (gravar ou importar)",
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  function stopStream() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stopStream();
        setRecording(false);
        setPaused(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        await uploadBlob(blob, "gravacao.webm");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  }

  function togglePause() {
    const r = recorderRef.current;
    if (!r) return;
    if (r.state === "recording") {
      r.pause();
      setPaused(true);
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else if (r.state === "paused") {
      r.resume();
      setPaused(false);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (!r || r.state === "inactive") return;
    r.stop();
  }

  async function uploadBlob(blob: Blob, name: string) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", blob, name);
      const res = await api<{ data: { url: string } }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      onChange(res.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload do áudio");
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file, file.name);
      const res = await api<{ data: { url: string } }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      onChange(res.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload do áudio");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function format(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {value && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
            <AudioLines className="h-5 w-5" />
          </span>
          <audio controls src={resolveImageUrl(value)} className="h-10 min-w-0 flex-1" preload="metadata" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            className="text-red-600"
            title="Remover áudio"
            aria-label="Remover áudio"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!recording && !paused ? (
          <Button type="button" variant="outline" size="sm" onClick={startRecording} disabled={uploading}>
            <Mic className="h-3.5 w-3.5" /> Gravar
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" onClick={togglePause}>
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {paused ? "Continuar" : "Pausar"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={stopRecording} disabled={uploading}>
              <Square className="h-3.5 w-3.5" /> Parar
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" /> Importar arquivo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/webm,audio/mp3,audio/mpeg,audio/ogg,audio/wav,audio/mp4,.m4a"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            recording ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
          )}
        >
          {recording && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
          {recording && !paused ? `Gravando ${format(elapsed)}` : paused ? `Pausado ${format(elapsed)}` : "Sem áudio"}
        </span>
        {uploading && <span className="text-xs text-muted-foreground">Enviando...</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}