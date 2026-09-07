import { useMemo } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  fill: string;
  opacity: number;
};

type Link = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

/** Deterministic PRNG so server and client render the identical field. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 800;
const H = 600;
/* Head-in-profile mass: cranial ellipse plus a neck column below it. */
const HEAD = { cx: 480, cy: 235, rx: 118, ry: 160 };
const NECK = { x: 432, y: 375, w: 96, h: 150 };

function insideHead(x: number, y: number): boolean {
  const inEllipse = ((x - HEAD.cx) / HEAD.rx) ** 2 + ((y - HEAD.cy) / HEAD.ry) ** 2 <= 1;
  const inNeck = x >= NECK.x && x <= NECK.x + NECK.w && y >= NECK.y && y <= NECK.y + NECK.h;
  return inEllipse || inNeck;
}

function buildField(seed: number, count: number): { particles: Particle[]; links: Link[] } {
  const rand = mulberry32(seed);
  const fills: Array<[string, number]> = [
    ["#ffffff", 0.34],
    ["#9a9a9a", 0.21],
    ["#8052ff", 0.2],
    ["#ffb829", 0.12],
    ["#15846e", 0.08],
    ["#bdbdbd", 0.05],
  ];
  const pick = () => {
    const r = rand();
    let acc = 0;
    for (const [fill, weight] of fills) {
      acc += weight;
      if (r <= acc) return fill;
    }
    return "#ffffff";
  };

  const particles: Particle[] = [];
  let guard = 0;
  while (particles.length < count && guard < count * 40) {
    guard += 1;
    const x = rand() * W;
    const y = rand() * H;
    if (!insideHead(x, y)) continue;
    const edge = ((x - HEAD.cx) / HEAD.rx) ** 2 + ((y - HEAD.cy) / HEAD.ry) ** 2;
    /* Denser core, sparser rim: keep rim points only sometimes. */
    if (edge > 0.55 && rand() < 0.68) continue;
    particles.push({
      x,
      y,
      size: 2.2 + rand() * 3.8,
      rotation: Math.floor(rand() * 360),
      fill: pick(),
      opacity: 0.45 + rand() * 0.55,
    });
  }

  /* A few wanderers outside the mass so the void is not sterile. */
  const wanderers = Math.floor(count / 24);
  for (let i = 0; i < wanderers; i += 1) {
    particles.push({
      x: rand() * W,
      y: rand() * H,
      size: 1.4 + rand() * 2,
      rotation: Math.floor(rand() * 360),
      fill: rand() < 0.7 ? "#9a9a9a" : "#8052ff",
      opacity: 0.18 + rand() * 0.25,
    });
  }

  const links: Link[] = [];
  for (let i = 0; i < particles.length && links.length < 70; i += 1) {
    const a = particles[i];
    if (!a) continue;
    for (let j = i + 1; j < particles.length && links.length < 70; j += 1) {
      const b = particles[j];
      if (!b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < 38 * 38 && rand() < 0.34) {
        links.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
  }
  return { particles, links };
}

/**
 * Dala signature: a constellation of tiny triangles forming a human head
 * in profile on the black void — many lenses, one self.
 * Pure decoration (aria-hidden); static under reduced motion via CSS.
 */
export function Constellation({
  className,
  seed = 7,
  density = 110,
}: {
  className?: string;
  seed?: number;
  density?: number;
}) {
  const field = useMemo(() => buildField(seed, density), [seed, density]);
  return (
    <div aria-hidden="true" className={className ?? "constellation-field"}>
      <svg
        className="constellation-drift"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox={`0 0 ${W} ${H}`}
      >
        {field.links.map((link, index) => (
          <line
            key={`l-${index}`}
            opacity={0.22}
            stroke="#8052ff"
            strokeWidth={0.7}
            x1={link.x1}
            x2={link.x2}
            y1={link.y1}
            y2={link.y2}
          />
        ))}
        {field.particles.map((p, index) => (
          <polygon
            key={`p-${index}`}
            fill={p.fill}
            opacity={p.opacity}
            points={`0,${-p.size} ${p.size * 0.9},${p.size * 0.7} ${-p.size * 0.9},${p.size * 0.7}`}
            transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rotation})`}
          />
        ))}
      </svg>
    </div>
  );
}
