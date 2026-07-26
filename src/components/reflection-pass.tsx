const sampleScores = [
  ["Keterbukaan", 82],
  ["Keteraturan", 64],
  ["Energi sosial", 43],
  ["Kooperasi", 76],
  ["Sensitivitas", 58],
] as const;

const passSteps = [
  "Pilih kedalaman refleksi",
  "Jawab dengan jujur",
  "Baca pola + batasan",
] as const;

export function ReflectionPass() {
  return (
    <aside
      aria-label="Ilustrasi cara membaca hasil"
      className="lens-glow bg-surface/70 relative overflow-hidden rounded-[1.2rem] border border-white/20 p-8 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgb(175_80_255_/_0.18),transparent_18rem)]"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label text-steel">Peta refleksi</p>
            <p className="mt-3 text-[1.75rem] leading-tight tracking-[-0.03em] sm:text-[2rem]">
              Baca sebagai spektrum
            </p>
          </div>
          <span className="mono-label shrink-0 rounded-[var(--radius-pill)] bg-white/8 px-3 py-1.5 text-[#f0f0f0]">
            ilustrasi
          </span>
        </div>

        <ul className="text-ink-muted mt-6 space-y-2 text-sm leading-6">
          {passSteps.map((step, index) => (
            <li className="flex gap-3" key={step}>
              <span className="font-mono text-xs text-[#f0f0f0]/70 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-5 border-t border-white/12 pt-6">
          {sampleScores.map(([label, value]) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span>{label}</span>
                <span className="font-mono text-xs text-[#f0f0f0]/70 tabular-nums">{value}</span>
              </div>
              <div className="h-px bg-white/12">
                <div className="bg-lens relative h-px" style={{ width: `${value}%` }}>
                  <span className="bg-lens absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/12 pt-5 text-sm">
          <div>
            <p className="mono-label text-steel">Cara baca</p>
            <p className="mt-2">Spektrum, bukan kotak</p>
          </div>
          <div>
            <p className="mono-label text-steel">Kontrol</p>
            <p className="mt-2">Private sampai dibagikan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
