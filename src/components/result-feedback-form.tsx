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
        className="border-success text-success mt-8 rounded-md border bg-white p-4 font-medium"
        role="status"
      >
        Terima kasih. Feedback tersimpan.
      </p>
    );
  return (
    <form
      className="border-line shadow-surface mt-8 rounded-lg border bg-white p-6"
      onSubmit={submit}
    >
      <h2 className="font-display text-ink text-xl font-semibold">Apakah hasil ini membantu?</h2>
      <Label className="mt-4" htmlFor="feedback-rating">
        Rating 1 sampai 5
      </Label>
      <select
        className="focus-ring border-line bg-canvas text-ink hover:border-lens/50 mt-2 min-h-12 w-full rounded-sm border px-4 text-sm transition duration-150 ease-out outline-none"
        defaultValue=""
        id="feedback-rating"
        name="rating"
        required
      >
        <option disabled value="">
          Pilih rating
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
          Feedback gagal dikirim.
        </p>
      ) : null}
      <Button className="mt-4" disabled={pending} type="submit">
        {pending ? "Mengirim…" : "Kirim feedback"}
      </Button>
    </form>
  );
}
