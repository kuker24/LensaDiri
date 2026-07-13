"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { completeAssessment, getAssessmentSession, saveAnswer } from "@/lib/assessment/client";
import type { AssessmentSessionView } from "@/server/repositories/assessment";

const labels = ["Sangat tidak sesuai", "Tidak sesuai", "Netral", "Sesuai", "Sangat sesuai"];

export function TestRunner({ token }: { token: string }) {
  const router = useRouter();
  const [session, setSession] = useState<AssessmentSessionView | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    getAssessmentSession(token)
      .then((loaded) => {
        setSession(loaded);
        const firstUnanswered = loaded.questions.findIndex((question) => question.answer === null);
        setIndex(
          firstUnanswered === -1 ? Math.max(0, loaded.questions.length - 1) : firstUnanswered,
        );
        setStartedAt(Date.now());
      })
      .catch(() => setError("Sesi tidak ditemukan atau sudah kedaluwarsa."));
  }, [token]);

  const question = session?.questions[index];
  const answeredCount = useMemo(
    () => session?.questions.filter((item) => item.answer !== null).length ?? 0,
    [session],
  );

  async function answer(value: number) {
    if (!session || !question) return;
    setPending(true);
    setError(null);
    try {
      await saveAnswer({
        idempotencyKey: crypto.randomUUID(),
        questionId: question.id,
        responseTimeMs: Date.now() - startedAt,
        token,
        value,
      });
      const questions = session.questions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, answer: value } : item,
      );
      setSession({
        ...session,
        answeredCount: questions.filter((item) => item.answer !== null).length,
        questions,
      });
      if (index < questions.length - 1) setIndex(index + 1);
      setStartedAt(Date.now());
    } catch {
      setError("Jawaban belum tersimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      const resultToken = await completeAssessment(token);
      router.push(`/result/${resultToken}`);
    } catch {
      setError("Pastikan semua pertanyaan sudah dijawab.");
      setPending(false);
    }
  }

  if (error && !session)
    return (
      <p className="mx-auto max-w-xl py-20 text-center text-red-800" role="alert">
        {error}
      </p>
    );
  if (!session || !question)
    return <p className="py-20 text-center text-[var(--muted)]">Memuat assessment…</p>;

  return (
    <section className="container-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <span>
            Pertanyaan {index + 1} dari {session.totalCount}
          </span>
          <span>{answeredCount} tersimpan</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full bg-violet-700 transition-[width]"
            style={{ width: `${(answeredCount / session.totalCount) * 100}%` }}
          />
        </div>
        <article className="mt-8 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-10">
          <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">{question.text}</h1>
          <fieldset className="mt-8 grid gap-3">
            <legend className="sr-only">Pilih tingkat kesesuaian</legend>
            {labels.map((label, itemIndex) => {
              const value = itemIndex + 1;
              return (
                <button
                  aria-pressed={question.answer === value}
                  className="focus-ring min-h-12 rounded-xl border border-[var(--line)] px-4 text-left font-medium hover:border-violet-400 aria-pressed:border-violet-700 aria-pressed:bg-violet-50"
                  disabled={pending}
                  key={label}
                  onClick={() => answer(value)}
                  type="button"
                >
                  <span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-full bg-violet-100 text-sm text-violet-800">
                    {value}
                  </span>
                  {label}
                </button>
              );
            })}
          </fieldset>
          {error ? (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-40"
              disabled={index === 0 || pending}
              onClick={() => {
                setIndex(index - 1);
                setStartedAt(Date.now());
              }}
              type="button"
            >
              Kembali
            </button>
            {answeredCount === session.totalCount ? (
              <button
                className="focus-ring rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white disabled:opacity-50"
                disabled={pending}
                onClick={finish}
                type="button"
              >
                Lihat hasil
              </button>
            ) : (
              <button
                className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-40"
                disabled={index === session.totalCount - 1 || pending}
                onClick={() => {
                  setIndex(index + 1);
                  setStartedAt(Date.now());
                }}
                type="button"
              >
                Berikutnya
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
