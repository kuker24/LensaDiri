"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  completeAssessment,
  getAssessmentSession,
  pauseAssessment,
  resolveAssessmentClarifier,
  resumeAssessment,
  saveAnswer,
  saveClarifierAssessmentAnswer,
  startAssessmentClarifier,
} from "@/lib/assessment/client";
import type {
  AssessmentSessionView,
  ClarifierQuestion,
  ClarifierSessionView,
} from "@/server/repositories/assessment";

const labels = ["Sangat tidak sesuai", "Tidak sesuai", "Netral", "Sesuai", "Sangat sesuai"];

function LikertSelector({
  answer,
  disabled,
  onAnswer,
}: {
  answer: number | null;
  disabled: boolean;
  onAnswer: (value: number) => void;
}) {
  return (
    <fieldset className="mt-8 grid gap-3">
      <legend className="sr-only">Pilih tingkat kesesuaian</legend>
      {labels.map((label, itemIndex) => {
        const value = itemIndex + 1;
        return (
          <button
            aria-pressed={answer === value}
            className="focus-ring min-h-12 rounded-xl border border-[var(--line)] px-4 text-left font-medium hover:border-violet-400 aria-pressed:border-violet-700 aria-pressed:bg-violet-50"
            disabled={disabled}
            key={label}
            onClick={() => onAnswer(value)}
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
  );
}

function ClarifierRunner({ clarifier, token }: { clarifier: ClarifierSessionView; token: string }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<ClarifierQuestion[]>(clarifier.questions);
  const [index, setIndex] = useState(
    Math.max(
      0,
      clarifier.questions.findIndex((question) => question.answer === null),
    ),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const question = questions[index];
  const answeredCount = questions.filter((item) => item.answer !== null).length;

  async function answer(value: number) {
    if (!question) return;
    setPending(true);
    setError(null);
    try {
      await saveClarifierAssessmentAnswer({
        questionId: question.id,
        responseTimeMs: Date.now() - startedAt,
        token,
        value,
      });
      const next = questions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, answer: value } : item,
      );
      setQuestions(next);
      if (index < next.length - 1) setIndex(index + 1);
      setStartedAt(Date.now());
    } catch {
      setError("Jawaban clarifier belum tersimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function resolve(action: "complete" | "skip") {
    setPending(true);
    setError(null);
    try {
      const resultToken = await resolveAssessmentClarifier(token, action);
      router.push(`/result/${resultToken}`);
    } catch {
      setError(
        action === "complete"
          ? "Jawab semua pertanyaan clarifier sebelum melanjutkan."
          : "Clarifier belum dapat dilewati. Coba lagi.",
      );
      setPending(false);
    }
  }

  if (!question) return null;
  return (
    <section className="container-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h1 className="text-xl font-semibold">Perjelas pola yang masih berdekatan</h1>
          <p className="mt-2 text-sm leading-6">
            Tambahan singkat ini membantu confidence. Kamu boleh melewatinya; hasil tetap tersedia
            dengan catatan kualitas.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <span>
            Clarifier {index + 1} dari {clarifier.totalCount}
          </span>
          <span>{answeredCount} tersimpan</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full bg-violet-700 transition-[width]"
            style={{ width: `${(answeredCount / clarifier.totalCount) * 100}%` }}
          />
        </div>
        <article className="mt-8 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-10">
          <p className="text-sm font-semibold text-violet-700 capitalize">
            {question.moduleKey.replaceAll("_", " ")}
          </p>
          <h2 className="mt-3 text-2xl leading-tight font-semibold sm:text-3xl">{question.text}</h2>
          <LikertSelector answer={question.answer} disabled={pending} onAnswer={answer} />
          {error ? (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-40"
              disabled={index === 0 || pending}
              onClick={() => setIndex(index - 1)}
              type="button"
            >
              Kembali
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-40"
                disabled={pending}
                onClick={() => resolve("skip")}
                type="button"
              >
                Lewati clarifier
              </button>
              {answeredCount === clarifier.totalCount ? (
                <button
                  className="focus-ring rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white disabled:opacity-50"
                  disabled={pending}
                  onClick={() => resolve("complete")}
                  type="button"
                >
                  Lihat hasil
                </button>
              ) : (
                <button
                  className="focus-ring rounded-xl border border-[var(--line)] px-4 py-3 font-semibold disabled:opacity-40"
                  disabled={index === clarifier.totalCount - 1 || pending}
                  onClick={() => setIndex(index + 1)}
                  type="button"
                >
                  Berikutnya
                </button>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function TestRunner({ token }: { token: string }) {
  const router = useRouter();
  const [session, setSession] = useState<AssessmentSessionView | null>(null);
  const [clarifier, setClarifier] = useState<ClarifierSessionView | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
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
        if (loaded.status === "clarifier_required") {
          startAssessmentClarifier(token)
            .then(setClarifier)
            .catch(() => undefined);
        }
      })
      .catch(() => setError("Sesi tidak ditemukan atau sudah kedaluwarsa."));
  }, [token]);

  const question = session?.questions[index];
  const answeredCount = useMemo(
    () => session?.questions.filter((item) => item.answer !== null).length ?? 0,
    [session],
  );
  const segmentQuestions =
    session && question?.segmentIndex
      ? session.questions.filter((item) => item.segmentIndex === question.segmentIndex)
      : [];
  const segmentAnswered = segmentQuestions.filter((item) => item.answer !== null).length;

  async function answer(value: number) {
    if (!session || !question || session.status !== "active") return;
    setPending(true);
    setSaveStatus("saving");
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
      setSaveStatus("saved");
      setStartedAt(Date.now());
    } catch {
      setSaveStatus("idle");
      setError("Jawaban belum tersimpan. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function togglePause() {
    if (!session || !session.questions[0]?.moduleKey) return;
    setPending(true);
    setError(null);
    try {
      if (session.status === "paused") {
        await resumeAssessment(token);
        setSession({ ...session, status: "active" });
      } else {
        await pauseAssessment(token);
        setSession({ ...session, status: "paused" });
      }
    } catch {
      setError("Status sesi belum dapat diubah. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setPending(true);
    setError(null);
    try {
      const completed = await completeAssessment(token);
      if (completed.kind === "result") {
        router.push(`/result/${completed.resultToken}`);
        return;
      }
      const loadedClarifier = await startAssessmentClarifier(token);
      setClarifier(loadedClarifier);
      setSession((current) => (current ? { ...current, status: "clarifier_required" } : current));
      setPending(false);
    } catch {
      setError("Pastikan semua pertanyaan sudah dijawab.");
      setPending(false);
    }
  }

  if (clarifier) return <ClarifierRunner clarifier={clarifier} token={token} />;
  if (error && !session) {
    return (
      <p className="mx-auto max-w-xl py-20 text-center text-red-800" role="alert">
        {error}
      </p>
    );
  }
  if (!session || !question) {
    return <p className="py-20 text-center text-[var(--muted)]">Memuat assessment…</p>;
  }

  const modular = session.isModular;
  return (
    <section className="container-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <span>
            Pertanyaan {index + 1} dari {session.totalCount}
          </span>
          <span aria-live="polite">
            {saveStatus === "saving" ? "Menyimpan…" : `${answeredCount} tersimpan`}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full bg-violet-700 transition-[width]"
            style={{ width: `${(answeredCount / session.totalCount) * 100}%` }}
          />
        </div>
        {modular && question.segmentIndex ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm">
            <span>
              Bagian {question.segmentIndex} dari {session.segmentCount ?? 1} · {segmentAnswered}/
              {segmentQuestions.length} terjawab
            </span>
            {session.status !== "paused" ? (
              <button
                className="focus-ring rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-semibold disabled:opacity-50"
                disabled={pending}
                onClick={togglePause}
                type="button"
              >
                Jeda sesi
              </button>
            ) : null}
          </div>
        ) : null}
        {session.status === "paused" ? (
          <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6 text-center">
            <h1 className="text-xl font-semibold">Sesi dijeda</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Progres tersimpan. Lanjutkan saat kamu siap.
            </p>
            <button
              className="focus-ring mt-5 min-h-12 rounded-xl bg-[var(--foreground)] px-5 font-semibold text-white"
              onClick={togglePause}
              type="button"
            >
              Lanjutkan sesi
            </button>
          </div>
        ) : (
          <article className="mt-8 rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-10">
            {modular ? (
              <p className="text-sm font-semibold text-violet-700 capitalize">
                {(question.moduleKey ?? "").replaceAll("_", " ")}
              </p>
            ) : null}
            <h1 className="mt-3 text-2xl leading-tight font-semibold sm:text-3xl">
              {question.text}
            </h1>
            <LikertSelector answer={question.answer} disabled={pending} onAnswer={answer} />
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
        )}
      </div>
    </section>
  );
}
