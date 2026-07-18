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
      className="border-line mt-10 rounded-lg border bg-white p-6"
      aria-labelledby="result-controls-title"
    >
      <h2 className="font-display text-xl font-semibold" id="result-controls-title">
        Kontrol hasil
      </h2>
      <p className="text-ink-muted mt-2 leading-7">
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
          className="focus-ring border-line text-ink hover:bg-mist inline-flex items-center rounded-sm border px-4 py-3 font-semibold transition-colors duration-150 ease-out"
          download
          href={`/api/result/export/${encodeURIComponent(token)}`}
        >
          Export JSON
        </a>
        <a
          className="focus-ring border-line text-ink hover:bg-mist inline-flex items-center rounded-sm border px-4 py-3 font-semibold transition-colors duration-150 ease-out"
          href="/start"
        >
          Tes ulang
        </a>
        <button
          className="focus-ring border-danger-soft text-danger hover:bg-danger-soft rounded-sm border px-4 py-3 font-semibold transition-colors duration-150 ease-out disabled:opacity-50"
          disabled={pending}
          onClick={remove}
          type="button"
        >
          Hapus hasil
        </button>
      </div>
      {shareUrl ? (
        <p className="border-lens-soft bg-lens-soft/40 mt-4 rounded-md border p-4 text-sm break-all">
          <a className="focus-ring text-lens-strong underline" href={shareUrl}>
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
