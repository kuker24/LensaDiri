"use client";

/** Positions only — no numeric scores (avoids “fake result” reading). */
const sampleTraits = [
  ["Keterbukaan", 82],
  ["Keteraturan", 64],
  ["Energi sosial", 43],
  ["Kooperasi", 76],
  ["Sensitivitas", 58],
] as const;

export function ReflectionPass() {
  return (
    <aside
      aria-label="Ilustrasi cara membaca hasil — contoh spektrum, bukan skor nyata"
      className="lens-glow relative overflow-hidden rounded-[16px] border border-white/20 p-8 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url(/media/design2/panel-void-detail.jpg)] bg-cover bg-center opacity-35"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/55" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label text-ink-muted">Contoh pola</p>
            <p className="mt-3 text-[1.75rem] leading-[0.95] tracking-[-0.02em] sm:text-[2rem]">
              Baca sebagai spektrum
            </p>
          </div>
          <span className="mono-label text-ink shrink-0 rounded-[12px] border border-white/20 bg-black/40 px-3 py-1.5">
            ilustrasi
          </span>
        </div>

        <p className="text-ink-muted mt-5 max-w-sm text-sm leading-6">
          Hasil nyata dihitung di server. Panel ini hanya contoh bentuk bacaan spektrum.
        </p>

        <div className="mt-8 space-y-5 border-t border-white/15 pt-6">
          {sampleTraits.map(([label, value]) => (
            <div className="spectrum-row" key={label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <span>{label}</span>
                <span className="text-ink-muted text-xs">contoh</span>
              </div>
              <div className="h-px bg-white/15">
                <div
                  className="spectrum-mark bg-frost relative h-px"
                  style={{ width: `${value}%` }}
                  aria-hidden="true"
                >
                  <span className="bg-frost absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-5 text-sm">
          <div>
            <p className="mono-label text-ink-muted">Baca</p>
            <p className="mt-2">Spektrum, bukan kotak</p>
          </div>
          <div>
            <p className="mono-label text-ink-muted">Kontrol</p>
            <p className="mt-2">Privat sampai dibagikan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
