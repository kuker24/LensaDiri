"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { boundedResponseTimeMs } from "@/components/assessment-response-timer";
import { Button } from "@/components/ui/button";
import { RecoveryPanel } from "@/components/recovery-panel";
import { Progress } from "@/components/ui/progress";

const labels = ["Sangat tidak sesuai", "Tidak sesuai", "Netral", "Sesuai", "Sangat sesuai"];

const moduleLabels: Record<string, string> = {
  attachment: "Refleksi Attachment",
  enneagram: "Lensa Motivasi",
  instinct: "Varian Instingtual",
  psychosophy: "Psychosophy",
  riasec: "Minat Karier RIASEC",
  socionics_communication: "Komunikasi Socionics",
  temperament: "Temperamen",
  three_center: "Pola Tiga Pusat",
  trait_profile: "Profil Trait",
  type_16: "16-Type",
};

function formatModuleKey(key: string | null | undefined): string {
  if (!key) return "Lensa";
  return moduleLabels[key] ?? key.replaceAll("_", " ");
}

function LikertSelector({
  answer,
  disabled,
  labelId,
  onAnswer,
}: {
  answer: number | null;
  disabled: boolean;
  labelId: string;
  onAnswer: (value: number) => void;
}) {
  return (
    <fieldset aria-labelledby={labelId} className="mt-8 grid gap-2">
      <legend className="sr-only">Pilih tingkat kesesuaian</legend>
      {labels.map((label, itemIndex) => {
        const value = itemIndex + 1;
        const selected = answer === value;
        return (
          <button
            aria-pressed={selected}
            className="likert-option focus-ring group border-line bg-surface text-ink aria-pressed:border-frost/70 aria-pressed:bg-lens-soft flex min-h-14 items-center rounded-[12px] border px-4 text-left font-normal hover:border-white/35"
            disabled={disabled}
            key={label}
            onClick={() => onAnswer(value)}
            type="button"
          >
            <span className="border-line bg-canvas text-ink-muted group-aria-pressed:border-frost/70 group-aria-pressed:bg-charcoal group-aria-pressed:text-ink ui-transition mr-3.5 inline-grid h-7 w-7 shrink-0 place-items-center rounded-[12px] border font-mono text-xs tabular-nums">
              {value}
            </span>
            <span className="leading-6">{label}</span>
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
  const answerInFlightRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const question = questions[index];
  const answeredCount = questions.filter((item) => item.answer !== null).length;

  async function answer(value: number) {
    if (!question || answerInFlightRef.current) return;

    answerInFlightRef.current = true;
    const questionId = question.id;
    const questionIndex = index;
    const responseTimeMs = boundedResponseTimeMs(startedAt);
    setPending(true);
    setError(null);
    try {
      await saveClarifierAssessmentAnswer({ questionId, responseTimeMs, token, value });
      setQuestions((current) =>
        current.map((item, itemIndex) =>
          itemIndex === questionIndex ? { ...item, answer: value } : item,
        ),
      );
      if (questionIndex < questions.length - 1) {
        setIndex(questionIndex + 1);
        requestAnimationFrame(() => questionHeadingRef.current?.focus());
      }
      setStartedAt(Date.now());
    } catch {
      setError("Jawaban clarifier belum tersimpan. Coba lagi.");
    } finally {
      answerInFlightRef.current = false;
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
    <section className="task-shell !py-8 sm:!py-14">
      <div className="mx-auto max-w-3xl">
        <div className="border-line bg-surface rounded-[16px] border p-5 sm:p-6">
          <p className="mono-label text-ink">Pertanyaan tambahan</p>
          <h1 className="mt-3 text-xl font-normal tracking-[-0.02em] sm:text-2xl">
            Perjelas pola yang masih berdekatan
          </h1>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Tambahan singkat ini membantu confidence. Kamu boleh melewatinya; hasil tetap tersedia
            dengan catatan kualitas.
          </p>
        </div>
        <div className="sticky top-14 z-10 mt-6 border-b border-white/12 bg-[rgb(0_0_0_/_0.9)] py-3 backdrop-blur-md">
          <div className="text-ink-muted flex items-center justify-between gap-4 font-mono text-xs tracking-[-0.02em]">
            <span className="tabular-nums">
              Clarifier {index + 1} / {clarifier.totalCount}
            </span>
            <span className="tabular-nums">{answeredCount} tersimpan</span>
          </div>
          <Progress
            aria-label="Progres clarifier"
            className="mt-3"
            max={clarifier.totalCount}
            value={answeredCount}
          />
        </div>
        <article className="border-line bg-surface mt-6 rounded-[16px] border p-6 sm:p-9">
          <p className="mono-label text-ink-muted">{formatModuleKey(question.moduleKey)}</p>
          <h2
            className="mt-3 text-2xl leading-snug font-normal tracking-[-0.025em] outline-none sm:text-3xl"
            id="clarifier-question"
            ref={questionHeadingRef}
            tabIndex={-1}
          >
            {question.text}
          </h2>
          <LikertSelector
            answer={question.answer}
            disabled={pending}
            labelId="clarifier-question"
            onAnswer={answer}
          />
          {error ? (
            <p className="text-danger mt-4 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="w-full sm:w-auto"
              disabled={index === 0 || pending}
              onClick={() => {
                setIndex(index - 1);
                setStartedAt(Date.now());
              }}
              type="button"
              variant="secondary"
            >
              Kembali
            </Button>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                className="w-full sm:w-auto"
                disabled={pending}
                onClick={() => resolve("skip")}
                type="button"
                variant="secondary"
              >
                Lewati clarifier
              </Button>
              {answeredCount === clarifier.totalCount ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={pending}
                  onClick={() => resolve("complete")}
                  type="button"
                >
                  Lihat hasil
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  disabled={index === clarifier.totalCount - 1 || pending}
                  onClick={() => {
                    setIndex(index + 1);
                    setStartedAt(Date.now());
                  }}
                  type="button"
                  variant="secondary"
                >
                  Berikutnya
                </Button>
              )}
            </div>
          </div>
        </article>
        <p className="text-ink-muted mt-5 text-center text-sm leading-6">
          Jawaban tersimpan per item. Ini bukan ujian.
        </p>
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
  const answerInFlightRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const pausedHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (session?.status === "paused") pausedHeadingRef.current?.focus();
  }, [session?.status]);

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
    if (!session || !question || session.status !== "active" || answerInFlightRef.current) return;

    answerInFlightRef.current = true;
    const questionId = question.id;
    const questionIndex = index;
    const responseTimeMs = boundedResponseTimeMs(startedAt);
    setPending(true);
    setSaveStatus("saving");
    setError(null);
    try {
      await saveAnswer({
        idempotencyKey: crypto.randomUUID(),
        questionId,
        responseTimeMs,
        token,
        value,
      });
      setSession((current) => {
        if (!current) return current;
        const questions = current.questions.map((item, itemIndex) =>
          itemIndex === questionIndex ? { ...item, answer: value } : item,
        );
        return {
          ...current,
          answeredCount: questions.filter((item) => item.answer !== null).length,
          questions,
        };
      });
      if (questionIndex < session.questions.length - 1) {
        setIndex(questionIndex + 1);
        requestAnimationFrame(() => questionHeadingRef.current?.focus());
      }
      setSaveStatus("saved");
      setStartedAt(Date.now());
    } catch {
      setSaveStatus("idle");
      setError("Jawaban belum tersimpan. Coba lagi.");
    } finally {
      answerInFlightRef.current = false;
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
        setStartedAt(Date.now());
        requestAnimationFrame(() => questionHeadingRef.current?.focus());
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
      const authoritative = await getAssessmentSession(token);
      setSession(authoritative);
      if (authoritative.answeredCount !== authoritative.totalCount) {
        setError("Pastikan semua pertanyaan sudah tersimpan.");
        setPending(false);
        return;
      }

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
      <div className="task-shell">
        <RecoveryPanel
          description={error}
          eyebrow="Sesi tidak tersedia"
          safeHref="/start"
          safeLabel="Pilih eksplorasi lain"
          title="Sesi tidak dapat dibuka"
        />
      </div>
    );
  }
  if (!session || !question) {
    return (
      <p className="text-ink-muted task-shell py-20 text-center font-mono text-xs tracking-[-0.02em] uppercase">
        Memuat pertanyaan…
      </p>
    );
  }

  const modular = session.isModular;
  return (
    <section className="task-shell !py-8 sm:!py-14">
      <div className="mx-auto max-w-3xl">
        <div className="sticky top-14 z-10 border-b border-white/12 bg-[rgb(0_0_0_/_0.9)] py-3 backdrop-blur-md">
          <div className="text-ink-muted flex flex-wrap items-center justify-between gap-3 font-mono text-xs tracking-[-0.02em]">
            <span className="tabular-nums">
              Pertanyaan {index + 1} / {session.totalCount}
            </span>
            <span aria-live="polite" className="tabular-nums">
              {saveStatus === "saving" ? "Menyimpan…" : `${answeredCount} tersimpan`}
            </span>
          </div>
          <Progress
            aria-label="Progres assessment"
            className="mt-3"
            max={session.totalCount}
            value={answeredCount}
          />
          {modular && question.segmentIndex ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-ink-muted tabular-nums">
                Bagian {question.segmentIndex}/{session.segmentCount ?? 1} · {segmentAnswered}/
                {segmentQuestions.length}
                {question.moduleKey ? ` · ${formatModuleKey(question.moduleKey)}` : ""}
              </span>
              {session.status !== "paused" ? (
                <Button
                  disabled={pending}
                  onClick={togglePause}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Jeda
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {session.status === "paused" ? (
          <div className="border-line bg-lens-soft mt-8 rounded-[16px] border p-8 text-center sm:p-10">
            <p className="mono-label text-ink">Dijeda</p>
            <h1
              className="text-ink mt-4 text-2xl font-normal tracking-[-0.02em] outline-none"
              ref={pausedHeadingRef}
              tabIndex={-1}
            >
              Sesi dijeda
            </h1>
            <p className="text-ink-muted mx-auto mt-3 max-w-md text-sm leading-6">
              Progres tersimpan. Lanjutkan saat siap — ini bukan ujian.
            </p>
            <Button className="mt-6" onClick={togglePause} type="button">
              Lanjutkan
            </Button>
          </div>
        ) : (
          <article className="border-line bg-surface mt-6 rounded-[16px] border p-6 sm:p-9">
            {modular ? (
              <p className="mono-label text-ink-muted">{formatModuleKey(question.moduleKey)}</p>
            ) : (
              <p className="mono-label text-ink-muted">Eksplorasi</p>
            )}
            <h1
              className="mt-3 text-2xl leading-snug font-normal tracking-[-0.025em] outline-none sm:text-3xl"
              id="assessment-question"
              ref={questionHeadingRef}
              tabIndex={-1}
            >
              {question.text}
            </h1>
            <LikertSelector
              answer={question.answer}
              disabled={pending}
              labelId="assessment-question"
              onAnswer={answer}
            />
            {error ? (
              <p className="text-danger mt-4 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="w-full sm:w-auto"
                disabled={index === 0 || pending}
                onClick={() => {
                  setIndex(index - 1);
                  setStartedAt(Date.now());
                }}
                type="button"
                variant="secondary"
              >
                Kembali
              </Button>
              {answeredCount === session.totalCount ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={pending}
                  onClick={finish}
                  type="button"
                >
                  Lihat hasil
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  disabled={index === session.totalCount - 1 || pending}
                  onClick={() => {
                    setIndex(index + 1);
                    setStartedAt(Date.now());
                  }}
                  type="button"
                  variant="secondary"
                >
                  Berikutnya
                </Button>
              )}
            </div>
          </article>
        )}
        <p className="text-ink-muted mt-5 text-center text-sm leading-6">
          Jawaban tersimpan per item. Kamu bisa menjeda kapan saja.
        </p>
      </div>
    </section>
  );
}
