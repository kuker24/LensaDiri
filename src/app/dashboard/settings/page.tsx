export default function DashboardSettingsPage() {
  return (
    <main className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold">Pengaturan Akun</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Kelola preferensi akun, notifikasi, dan data pribadimu.
      </p>

      <div className="border-line rounded-lg border bg-white/90 p-6">
        <h2 className="text-lg font-semibold">Preferensi</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <strong>Email:</strong>{" "}
            <span className="text-ink-muted">Dikelola melalui halaman login.</span>
          </li>
          <li>
            <strong>Audio:</strong>{" "}
            <span className="text-ink-muted">Preferensi musik disimpan lokal pada browser.</span>
          </li>
          <li>
            <strong>Motion:</strong>{" "}
            <span className="text-ink-muted">
              Animasi mengikuti sistem <code>prefers-reduced-motion</code>.
            </span>
          </li>
        </ul>
      </div>
    </main>
  );
}
