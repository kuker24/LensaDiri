"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postAuthenticatedMutation } from "@/lib/auth/client";

export function ResultControls({ token }: { token: string }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function mutate(path: string) {
    setPending(true);
    setMessage(null);
    try {
      const data = await postAuthenticatedMutation<{
        shareToken?: string;
        revoked?: boolean;
        status?: string;
      }>(path, { token });
      setPending(false);
      return data;
    } catch {
      setPending(false);
      setMessage("Aksi gagal. Coba lagi.");
      return null;
    }
  }

  async function share() {
    const data = await mutate("/api/result/share");
    if (data?.shareToken) {
      const url = `${window.location.origin}/shared/${data.shareToken}`;
      setShareUrl(url);
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setMessage("Link berbagi dibuat dan disalin jika browser mengizinkan.");
    }
  }
  async function revoke() {
    const data = await mutate("/api/result/revoke");
    if (data) {
      setShareUrl(null);
      setMessage(data.revoked ? "Semua link aktif dicabut." : "Tidak ada link aktif.");
    }
  }
  async function remove() {
    if (!window.confirm("Hapus hasil dan semua jawaban terkait secara permanen?")) return;
    const data = await mutate("/api/result/delete");
    if (data) {
      router.push("/start");
      router.refresh();
    }
  }

  return (
    <section
      className="mt-10 rounded-2xl border border-[var(--line)] bg-white p-6"
      aria-labelledby="result-controls-title"
    >
      <h2 className="text-xl font-semibold" id="result-controls-title">
        Kontrol hasil
      </h2>
      <p className="mt-2 leading-7 text-[var(--muted)]">
        Hasil private sampai kamu membuat link. Export tidak memuat jawaban mentah atau ID internal.
        Tes ulang memulai sesi baru tanpa menghapus hasil ini.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="focus-ring rounded-xl bg-[var(--foreground)] px-4 py-3 font-semibold text-white disabled:opacity-50"
          disabled={pending}
          onClick={share}
          type="button"
        >
          Buat link berbagi
        </button>
        <button
          className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-50"
          disabled={pending}
          onClick={revoke}
          type="button"
        >
          Cabut semua link
        </button>
        <a
          className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold"
          download
          href={`/api/result/export/${encodeURIComponent(token)}`}
        >
          Export JSON
        </a>
        <a
          className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold"
          href="/start"
        >
          Tes ulang
        </a>
        <button
          className="focus-ring rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-800 disabled:opacity-50"
          disabled={pending}
          onClick={remove}
          type="button"
        >
          Hapus hasil
        </button>
      </div>
      {shareUrl ? (
        <p className="mt-4 rounded-xl bg-violet-50 p-4 text-sm break-all">
          <a className="focus-ring text-violet-800 underline" href={shareUrl}>
            {shareUrl}
          </a>
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 text-sm text-[var(--muted)]" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
