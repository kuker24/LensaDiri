export default function DashboardSettingsPage() {
  return (
    <div className="task-shell">
      <p className="mono-label text-ink">Akun</p>
      <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em]">Informasi akun</h1>
      <p className="text-ink-muted mt-2 mb-8 max-w-2xl leading-7">
        Ringkasan akses akun dan perilaku aksesibilitas antarmuka.
      </p>

      <div className="border-line bg-surface rounded-[16px] border p-6">
        <h2 className="text-lg font-normal">Antarmuka</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <li>
            <strong>Email:</strong> <span className="text-ink-muted">Dikelola melalui login.</span>
          </li>
          <li>
            <strong>Gerakan:</strong>{" "}
            <span className="text-ink-muted">
              Animasi mengikuti preferensi pengurangan gerakan pada perangkat.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
