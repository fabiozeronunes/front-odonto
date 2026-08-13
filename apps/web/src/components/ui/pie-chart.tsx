interface Slice {
  label: string;
  value: number;
  color: string;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function PieChart({ slices, size = 200 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  if (total <= 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-sm">
          Sem dados
        </text>
      </svg>
    );
  }

  const arcs: { path: string; color: string }[] = [];
  let angle = 0;
  for (const s of slices) {
    const frac = s.value / total;
    const start = angle;
    const end = angle + frac * 360;
    const large = frac > 0.5 ? 1 : 0;
    const p1 = polar(cx, cy, r, start);
    const p2 = polar(cx, cy, r, end);
    const path =
      frac >= 1
        ? `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`
        : `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
    arcs.push({ path, color: s.color });
    angle = end;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <path key={i} d={a.path} fill={a.color} stroke="#ffffff" strokeWidth={2} />
      ))}
    </svg>
  );
}

export { polar };