"use client";
import { type FormEvent, useState } from "react";
import { postAuthenticatedMutation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";

export function ResultFeedbackForm({ token }: { token: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const data = new FormData(event.currentTarget);
    try {
      await postAuthenticatedMutation("/api/result/feedback", {
        message: String(data.get("message") ?? ""),
        rating: Number(data.get("rating")),
        token,
      });
      setSent(true);
    } catch {
      setError(true);
      setPending(false);
    }
  }
  if (sent)
    return (
      <p
        className="border-success/30 bg-success-soft text-success mt-8 rounded-[12px] border p-4 text-sm"
        role="status"
      >
        Terima kasih. Masukanmu tersimpan.
      </p>
    );
  return (
    <form className="border-line bg-surface mt-8 rounded-[16px] border p-6" onSubmit={submit}>
      <p className="mono-label text-ink-muted">Opsional</p>
      <h2 className="text-ink mt-3 text-xl font-normal tracking-[-0.02em]">
        Apakah hasil ini membantu?
      </h2>
      <Label className="mt-4" htmlFor="feedback-rating">
        Nilai 1 sampai 5
      </Label>
      <select
        className="focus-ring ui-transition bg-surface-raised text-ink mt-2 min-h-12 w-full rounded-[12px] border border-white/30 px-4 text-base outline-none hover:border-white/45 sm:text-sm"
        defaultValue=""
        id="feedback-rating"
        name="rating"
        required
      >
        <option disabled value="">
          Pilih nilai
        </option>
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <Label className="mt-4" htmlFor="feedback-message">
        Catatan opsional
      </Label>
      <Textarea className="mt-2 min-h-28" id="feedback-message" maxLength={1000} name="message" />
      {error ? (
        <p className="text-danger mt-3 text-sm" role="alert">
          Masukan gagal dikirim.
        </p>
      ) : null}
      <Button className="mt-5 w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? "Mengirim…" : "Kirim masukan"}
      </Button>
    </form>
  );
}
