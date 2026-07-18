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
      <p className="mt-8 rounded-md border border-success bg-white p-4 text-success font-medium" role="status">
        Terima kasih. Feedback tersimpan.
      </p>
    );
  return (
    <form className="mt-8 rounded-lg border border-line bg-white p-6 shadow-surface" onSubmit={submit}>
      <h2 className="font-display text-xl font-semibold text-ink">Apakah hasil ini membantu?</h2>
      <Label className="mt-4" htmlFor="feedback-rating">
        Rating 1 sampai 5
      </Label>
      <select
        className="focus-ring mt-2 min-h-12 w-full rounded-sm border border-line bg-canvas px-4 text-sm text-ink outline-none transition duration-150 ease-out hover:border-lens/50"
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
      <Textarea
        className="mt-2 min-h-28"
        id="feedback-message"
        maxLength={1000}
        name="message"
      />
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          Feedback gagal dikirim.
        </p>
      ) : null}
      <Button
        className="mt-4"
        disabled={pending}
        type="submit"
      >
        {pending ? "Mengirim…" : "Kirim feedback"}
      </Button>
    </form>
  );
}
