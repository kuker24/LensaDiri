export default function DashboardSettingsPage() {
  return (
    <div className="task-shell">
      <p className="mono-label text-ink">Akun</p>
      <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em]">Pengaturan</h1>
      <p className="text-ink-muted mt-2 mb-8 max-w-2xl leading-7">
        Preferensi akun dan perilaku antarmuka.
      </p>

      <div className="border-line bg-surface rounded-[10px] border p-6">
        <h2 className="text-lg font-normal">Preferensi</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <strong>Email:</strong> <span className="text-ink-muted">Dikelola melalui login.</span>
          </li>
          <li>
            <strong>Audio:</strong>{" "}
            <span className="text-ink-muted">Preferensi musik disimpan lokal di browser.</span>
          </li>
          <li>
            <strong>Motion:</strong>{" "}
            <span className="text-ink-muted">
              Animasi mengikuti <code>prefers-reduced-motion</code>.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
