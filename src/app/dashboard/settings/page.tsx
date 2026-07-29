import { redirect } from "next/navigation";

import { OidcButtons } from "@/components/oidc-buttons";
import { getServerEnvironment } from "@/lib/db/env";
import { getCurrentSession } from "@/server/current-session";
import { listAccountOidcProviders } from "@/server/repositories/oidc-identities";

export default async function DashboardSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const environment = getServerEnvironment();
  const linked = await listAccountOidcProviders(session.accountId);
  const available = [
    ...(environment.googleOidc && !linked.includes("google") ? (["google"] as const) : []),
    ...(environment.appleOidc && !linked.includes("apple") ? (["apple"] as const) : []),
  ];

  return (
    <div className="task-shell">
      <p className="mono-label text-ink">Akun</p>
      <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em]">Pengaturan</h1>
      <p className="text-ink-muted mt-2 mb-8 max-w-2xl leading-7">
        Preferensi akun dan perilaku antarmuka.
      </p>

      <div className="border-line bg-surface rounded-[16px] border p-6">
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
      <div className="border-line bg-surface mt-5 rounded-[16px] border p-6">
        <h2 className="text-lg font-normal">Metode masuk</h2>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Kata sandi tetap aktif. Provider tertaut hanya dipakai untuk membuktikan identitas; sesi
          LensaDiri tetap dikelola aplikasi.
        </p>
        {linked.length > 0 ? (
          <p className="text-ink-muted mt-4 text-sm">
            Tertaut:{" "}
            {linked.map((provider) => (provider === "google" ? "Google" : "Apple")).join(", ")}.
          </p>
        ) : null}
        <div className="mt-5 max-w-sm">
          <OidcButtons operation="link" providers={[...available]} />
        </div>
      </div>
    </div>
  );
}
