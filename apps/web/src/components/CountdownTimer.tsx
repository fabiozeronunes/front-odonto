import { useEffect, useState } from "react";
import { Timer, Rocket } from "lucide-react";

interface CountdownTimerProps {
  startsAt?: string | Date | null;
  endsAt: string | Date | null;
  className?: string;
}

function getDiff(target: number) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({ startsAt, endsAt, className }: CountdownTimerProps) {
  const start = startsAt ? new Date(startsAt).getTime() : 0;
  const end = endsAt ? new Date(endsAt).getTime() : 0;
  const now = Date.now();
  const counting = end > now && (!start || now >= start);
  const waiting = start > now;
  const target = waiting ? start : end;

  const [left, setLeft] = useState(() => getDiff(target));

  useEffect(() => {
    setLeft(getDiff(target));
    const id = setInterval(() => setLeft(getDiff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!left || (!waiting && !counting)) return null;

  const cells = [
    { label: "dias", value: left.days },
    { label: "horas", value: pad(left.hours) },
    { label: "min", value: pad(left.minutes) },
    { label: "seg", value: pad(left.seconds) },
  ];

  return (
    <div className={className}>
      <p className="flex items-center gap-1 text-xs font-semibold text-red-600">
        {waiting ? <Rocket className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5" />}
        {waiting ? "Promoção começa em" : "Termina em"}
      </p>
      <div className="mt-1 inline-flex divide-x divide-red-200 overflow-hidden rounded-lg border border-red-200 bg-red-50">
        {cells.map((c) => (
          <div key={c.label} className="flex flex-col items-center px-2 py-1">
            <span className="font-display text-sm font-bold tabular-nums text-red-700">{c.value}</span>
            <span className="text-[10px] uppercase tracking-wide text-red-500">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
