"use client";
import { type FormEvent, useState } from "react";
import { postAuthenticatedMutation } from "@/lib/auth/client";
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
      <p className="mt-8 rounded-xl bg-emerald-50 p-4 text-emerald-950" role="status">
        Terima kasih. Feedback tersimpan.
      </p>
    );
  return (
    <form className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-6" onSubmit={submit}>
      <h2 className="text-xl font-semibold">Apakah hasil ini membantu?</h2>
      <label className="mt-4 block text-sm font-semibold" htmlFor="feedback-rating">
        Rating 1 sampai 5
      </label>
      <select
        className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4"
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
      <label className="mt-4 block text-sm font-semibold" htmlFor="feedback-message">
        Catatan opsional
      </label>
      <textarea
        className="focus-ring mt-2 min-h-28 w-full rounded-xl border border-[var(--line)] p-4"
        id="feedback-message"
        maxLength={1000}
        name="message"
      />
      {error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          Feedback gagal dikirim.
        </p>
      ) : null}
      <button
        className="focus-ring mt-4 rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Mengirim…" : "Kirim feedback"}
      </button>
    </form>
  );
}
