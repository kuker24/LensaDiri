"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postAuthenticatedMutation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

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
      className="mt-10 rounded-lg border border-line bg-white p-6"
      aria-labelledby="result-controls-title"
    >
      <h2 className="font-display text-xl font-semibold" id="result-controls-title">
        Kontrol hasil
      </h2>
      <p className="mt-2 leading-7 text-ink-muted">
        Hasil private sampai kamu membuat link. Export tidak memuat jawaban mentah atau ID internal.
        Tes ulang memulai sesi baru tanpa menghapus hasil ini.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={pending} onClick={share} type="button">
          Buat link berbagi
        </Button>
        <Button disabled={pending} onClick={revoke} type="button" variant="secondary">
          Cabut semua link
        </Button>
        <a
          className="focus-ring inline-flex items-center rounded-sm border border-line px-4 py-3 font-semibold text-ink transition-colors duration-150 ease-out hover:bg-mist"
          download
          href={`/api/result/export/${encodeURIComponent(token)}`}
        >
          Export JSON
        </a>
        <a
          className="focus-ring inline-flex items-center rounded-sm border border-line px-4 py-3 font-semibold text-ink transition-colors duration-150 ease-out hover:bg-mist"
          href="/start"
        >
          Tes ulang
        </a>
        <button
          className="focus-ring rounded-sm border border-danger-soft px-4 py-3 font-semibold text-danger transition-colors duration-150 ease-out hover:bg-danger-soft disabled:opacity-50"
          disabled={pending}
          onClick={remove}
          type="button"
        >
          Hapus hasil
        </button>
      </div>
      {shareUrl ? (
        <p className="mt-4 rounded-md border border-lens-soft bg-lens-soft/40 p-4 text-sm break-all">
          <a className="focus-ring text-lens-strong underline" href={shareUrl}>
            {shareUrl}
          </a>
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 text-sm text-ink-muted" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
