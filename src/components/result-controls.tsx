"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postAuthenticatedMutation } from "@/lib/auth/client";
import { Button, getButtonClassName } from "@/components/ui/button";

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
      setMessage("Tautan berbagi dibuat dan disalin jika browser mengizinkan.");
    }
  }
  async function revoke() {
    const data = await mutate("/api/result/revoke");
    if (data) {
      setShareUrl(null);
      setMessage(data.revoked ? "Semua tautan aktif dicabut." : "Tidak ada tautan aktif.");
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
      className="bg-surface mt-10 scroll-mt-28 rounded-[16px] border border-dashed border-white/30 p-6"
      aria-labelledby="result-controls-title"
      id="share-controls"
    >
      <p className="mono-label text-ink-muted">Surface berbagi · public-safe</p>
      <h2 className="mt-3 text-xl font-normal tracking-[-0.02em]" id="result-controls-title">
        Kontrol hasil
      </h2>
      <p className="text-ink-muted mt-2 leading-7">
        Hasil tetap privat sampai kamu membuat tautan berbagi. Tautan publik memakai allowlist
        terpisah — tanpa skor mentah, diagnostics, atau data pemilik. Tes ulang memulai sesi baru
        tanpa menghapus hasil ini.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={pending} onClick={share} type="button">
          Buat tautan berbagi
        </Button>
        <Button disabled={pending} onClick={revoke} type="button" variant="secondary">
          Cabut semua tautan
        </Button>
        <a
          className={getButtonClassName("secondary", "sm")}
          download
          href={`/api/result/export/${encodeURIComponent(token)}`}
        >
          Unduh laporan (PDF)
        </a>
        <a
          className={getButtonClassName("ghost", "sm")}
          download
          href={`/api/result/export/${encodeURIComponent(token)}?format=json`}
        >
          Data JSON
        </a>
        <a className={getButtonClassName("secondary", "sm")} href="/start">
          Tes ulang
        </a>
        <button
          className="focus-ring pressable border-danger/30 text-danger hover:bg-danger-soft min-h-12 rounded-[12px] border px-4 py-3 font-semibold disabled:opacity-50"
          disabled={pending}
          onClick={remove}
          type="button"
        >
          Hapus hasil
        </button>
      </div>
      {shareUrl ? (
        <p className="border-lens/30 bg-lens-soft mt-4 rounded-[16px] border p-4 text-sm break-all">
          <a className="focus-ring text-aperture underline" href={shareUrl}>
            {shareUrl}
          </a>
        </p>
      ) : null}
      {message ? (
        <p className="text-ink-muted mt-4 text-sm" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
