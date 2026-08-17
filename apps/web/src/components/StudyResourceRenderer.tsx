import { useState } from "react";
import { cn } from "../lib/utils";
import type { StudyResource } from "../types";
import { Button } from "./ui/button";

export function StudyResourceRenderer({ resource }: { resource: StudyResource }) {
  const content = resource.content as Record<string, unknown> | null;
  if (!content) return <p className="text-sm text-muted-foreground">Sem conteúdo.</p>;

  switch (resource.type) {
    case "QUIZ":
      return <QuizView content={content} />;
    case "FLASHCARDS":
      return <FlashcardsView content={content} />;
    case "QUESTIONARIO":
      return <QaView content={content} />;
    case "MIND_MAP":
      return <MindMapView content={content} />;
    case "INFOGRAPHIC":
      return <InfoView content={content} />;
    case "RESUMO":
    case "AUDIO_RESUMO":
      return <SummaryView content={content} />;
    case "TRANSCRICAO":
      return <TranscriptView content={content} />;
    default:
      return (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}

function QuizView({ content }: { content: Record<string, unknown> }) {
  const questions = (content.questions ?? []) as {
    question: string;
    options: string[];
    correctIndex?: number;
    explanation?: string;
  }[];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reveal, setReveal] = useState(false);

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-lg border border-border p-3">
          <p className="text-sm font-medium text-foreground">
            {qi + 1}. {q.question}
          </p>
          <div className="mt-2 space-y-1">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = q.correctIndex === oi;
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={reveal}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors",
                    reveal && isCorrect
                      ? "border-green-500 bg-green-50 text-green-800 dark:bg-green-950/40"
                      : reveal && selected && !isCorrect
                      ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/40"
                      : selected
                      ? "border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-950/40"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <span className="font-mono text-xs">{String.fromCharCode(97 + oi)})</span> {opt}
                </button>
              );
            })}
          </div>
          {reveal && q.explanation && (
            <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>
          )}
        </div>
      ))}
      {questions.length > 0 && (
        <Button size="sm" variant="outline" onClick={() => setReveal((v) => !v)}>
          {reveal ? "Ocultar gabarito" : "Revelar gabarito"}
        </Button>
      )}
    </div>
  );
}

function FlashcardsView({ content }: { content: Record<string, unknown> }) {
  const cards = (content.cards ?? []) as { front: string; back: string }[];
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [idx, setIdx] = useState(0);
  const card = cards[idx];
  if (!card) return <p className="text-sm text-muted-foreground">Sem flashcards.</p>;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setFlipped((f) => ({ ...f, [idx]: !f[idx] }))}
        className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-primary-200 bg-primary-50/60 p-5 text-center transition-colors hover:bg-primary-50 dark:border-primary-900 dark:bg-primary-950/30"
      >
        {flipped[idx] ? (
          <p className="text-sm text-foreground">{card.back}</p>
        ) : (
          <p className="text-base font-medium text-foreground">{card.front}</p>
        )}
        <span className="mt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          {flipped[idx] ? "Resposta" : "Pergunta"} — clique para virar
        </span>
      </button>
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" disabled={idx === 0} onClick={() => { setIdx(0); setFlipped({}); }}>
          Reiniciar
        </Button>
        <span className="text-xs text-muted-foreground">
          {idx + 1} / {cards.length}
        </span>
        <Button
          size="sm"
          disabled={idx === cards.length - 1}
          onClick={() => setIdx((i) => Math.min(i + 1, cards.length - 1))}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}

function QaView({ content }: { content: Record<string, unknown> }) {
  const questions = (content.questions ?? []) as { question: string; answer: string }[];
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-3">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-lg border border-border p-3">
          <p className="text-sm font-medium text-foreground">
            {qi + 1}. {q.question}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-1"
            onClick={() => setShowAnswers((s) => ({ ...s, [qi]: !s[qi] }))}
          >
            {showAnswers[qi] ? "Ocultar resposta" : "Mostrar resposta"}
          </Button>
          {showAnswers[qi] && (
            <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">{q.answer}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function MindMapView({ content }: { content: Record<string, unknown> }) {
  const nodes = (content.nodes ?? []) as { label: string; children?: { label: string }[] }[];
  const title = (content.title as string) ?? "Mapa mental";
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-foreground">{title}</p>
      <div className="space-y-2">
        {nodes.map((n, i) => (
          <div key={i} className="rounded-lg border border-primary-200 bg-primary-50/60 p-3 dark:border-primary-900 dark:bg-primary-950/30">
            <p className="text-sm font-semibold text-foreground">{n.label}</p>
            {n.children && n.children.length > 0 && (
              <ul className="mt-1 space-y-0.5 pl-3 text-sm text-muted-foreground">
                {n.children.map((c, ci) => (
                  <li key={ci} className="list-disc">{c.label}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoView({ content }: { content: Record<string, unknown> }) {
  const sections = (content.sections ?? []) as { heading: string; points: string[] }[];
  const title = (content.title as string) ?? "Infográfico";
  return (
    <div>
      <p className="mb-3 text-sm font-bold text-foreground">{title}</p>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold text-foreground">{s.heading}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {s.points.map((p, pi) => (
                <li key={pi}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TranscriptView({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) ?? (content.raw as string) ?? "";
  if (!text) return <p className="text-sm text-muted-foreground">Sem transcrição.</p>;
  return (
    <p className="max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {text}
    </p>
  );
}

function SummaryView({ content }: { content: Record<string, unknown> }) {
  const summary = (content.summary as string) ?? "";
  const keyPoints = (content.keyPoints ?? []) as string[];
  return (
    <div>
      {summary && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{summary}</p>
      )}
      {keyPoints.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-foreground">Pontos-chave</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {keyPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}