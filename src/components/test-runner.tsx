"use client";

import NextImage from "next/image";
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
import { cn } from "@/lib/cn";
import { getStoredGender, type CharacterGender } from "@/lib/assessment/gender-storage";

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

const defaultToneVariant = {
  selected: "border-iris bg-iris-wash text-ink ring-iris/30 shadow-sm ring-2",
  unselected: "border-line bg-surface-raised text-ink hover:border-iris/45 hover:bg-surface",
  badgeSelected: "bg-iris text-canvas shadow-sm",
};

const toneVariants = Array.from({ length: 5 }, () => defaultToneVariant);

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
    <fieldset aria-labelledby={labelId} className="mt-8 grid gap-3">
      <legend className="sr-only">Pilih tingkat kesesuaian</legend>
      {labels.map((label, itemIndex) => {
        const value = itemIndex + 1;
        const selected = answer === value;
        const tone = toneVariants[itemIndex] ?? toneVariants[0]!;
        return (
          <button
            aria-pressed={selected}
            className={cn(
              "likert-option group flex min-h-[58px] w-full cursor-pointer items-center rounded-2xl border px-5 py-3.5 text-left backdrop-blur-md active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50",
              selected ? tone.selected : tone.unselected,
            )}
            disabled={disabled}
            key={label}
            onClick={() => onAnswer(value)}
            type="button"
          >
            <span
              className={cn(
                "ui-transition mr-4 inline-grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold tabular-nums",
                selected
                  ? tone.badgeSelected
                  : "border-line bg-surface text-ink-muted group-hover:border-iris/45 group-hover:text-ink border",
              )}
            >
              {value}
            </span>
            <span className="text-base font-medium tracking-[-0.01em]">{label}</span>
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
      setError("Jawaban tambahan belum tersimpan. Coba lagi.");
    } finally {
      answerInFlightRef.current = false;
      setPending(false);
    }
  }

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (pending) return;
      const target = event.target as HTMLElement | null;
      const tagName =
        target && "tagName" in target ? (target as HTMLElement).tagName?.toLowerCase() : undefined;
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        (target && "isContentEditable" in target && (target as HTMLElement).isContentEditable)
      )
        return;

      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        const val = Number.parseInt(event.key, 10);
        answerRef.current(val);
        return;
      }

      if (event.key === "ArrowLeft") {
        if (index > 0 && !pending) {
          event.preventDefault();
          setIndex((prev) => prev - 1);
          setStartedAt(Date.now());
          requestAnimationFrame(() => questionHeadingRef.current?.focus());
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, pending]);

  async function resolve(action: "complete" | "skip") {
    setPending(true);
    setError(null);
    try {
      const resultToken = await resolveAssessmentClarifier(token, action);
      router.push(`/result/${resultToken}`);
    } catch {
      setError(
        action === "complete"
          ? "Jawab semua pertanyaan tambahan sebelum melanjutkan."
          : "Pertanyaan tambahan belum dapat dilewati. Coba lagi.",
      );
      setPending(false);
    }
  }

  if (!question) return null;
  return (
    <section className="bg-canvas relative min-h-[calc(100svh-3.5rem)] px-4 py-8 sm:px-6 sm:py-14">
      <div
        aria-hidden="true"
        className="bg-iris-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 blur-3xl"
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="bg-surface border-line rounded-[24px] border p-6 shadow-[0_8px_24px_rgb(27_28_26_/_0.07)] sm:p-8">
          <span className="bg-iris-wash text-iris inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-wider uppercase">
            <span className="bg-iris h-1 w-1 rounded-full" />
            Pertanyaan Penjelas
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
            Mempertajam Pola yang Berimbang
          </h1>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
            Jawabanmu pada beberapa aspek berada di rentang yang seimbang. Pertanyaan singkat ini
            membantu mempertajam gambaran dirimu. Kamu juga bebas melewatinya kapan saja.
          </p>
        </div>
        <div className="border-line sticky top-14 z-10 mt-6 rounded-full border bg-[rgb(251_249_245_/_0.94)] px-6 py-3.5 shadow-[0_4px_18px_rgb(27_28_26_/_0.08)] backdrop-blur-2xl">
          <div className="text-ink-muted flex items-center justify-between gap-4 font-mono text-xs">
            <span className="flex items-center gap-2 tabular-nums">
              <span className="bg-iris h-1.5 w-1.5 rounded-full" />
              Pertanyaan tambahan {index + 1} / {clarifier.totalCount}
            </span>
            <span className="text-ink font-semibold tabular-nums">{answeredCount} tersimpan</span>
          </div>
          <Progress
            aria-label="Progres pertanyaan tambahan"
            className="bg-line mt-3 h-1.5 rounded-full"
            max={clarifier.totalCount}
            value={answeredCount}
          />
        </div>
        <article className="bg-surface border-line mt-6 rounded-[28px] border p-7 shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-11">
          <div className="bg-iris-wash text-iris inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-wider uppercase">
            {formatModuleKey(question.moduleKey)}
          </div>
          <h2
            className="mt-4 text-2xl leading-snug font-semibold tracking-[-0.025em] outline-none sm:text-3xl"
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
              className="w-full rounded-full sm:w-auto"
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
                className="w-full rounded-full sm:w-auto"
                disabled={pending}
                onClick={() => resolve("skip")}
                type="button"
                variant="ghost"
              >
                Lewati bagian ini
              </Button>
              {answeredCount === clarifier.totalCount ? (
                <Button
                  className="w-full rounded-full shadow-[0_10px_30px_rgba(157,66,35,0.18)] sm:w-auto"
                  disabled={pending}
                  onClick={() => resolve("complete")}
                  type="button"
                >
                  Lihat hasil
                </Button>
              ) : (
                <Button
                  className="w-full rounded-full sm:w-auto"
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
  const [gender] = useState<CharacterGender>(() => getStoredGender());
  const answerInFlightRef = useRef(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const pausedHeadingRef = useRef<HTMLHeadingElement>(null);

  const figureSrc = gender === "laki" ? "/figurines/base-male.png" : "/figurines/base-female.png";

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

  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (session?.status !== "active" || pending) return;
      const target = event.target as HTMLElement | null;
      const tagName =
        target && "tagName" in target ? (target as HTMLElement).tagName?.toLowerCase() : undefined;
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        (target && "isContentEditable" in target && (target as HTMLElement).isContentEditable)
      )
        return;

      if (["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        const val = Number.parseInt(event.key, 10);
        answerRef.current(val);
        return;
      }

      if (event.key === "ArrowLeft") {
        if (index > 0 && !pending) {
          event.preventDefault();
          setIndex((prev) => prev - 1);
          setStartedAt(Date.now());
          requestAnimationFrame(() => questionHeadingRef.current?.focus());
        }
        return;
      }

      if (event.key === "ArrowRight") {
        if (session && question?.answer !== null && index < session.totalCount - 1 && !pending) {
          event.preventDefault();
          setIndex((prev) => prev + 1);
          setStartedAt(Date.now());
          requestAnimationFrame(() => questionHeadingRef.current?.focus());
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, question?.answer, session, pending]);

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
    <section className="bg-canvas text-ink relative min-h-[calc(100svh-3.5rem)] overflow-x-hidden px-4 py-6 font-sans sm:px-6 sm:py-10">
      {/* Ambient wash: colour lives in the light, never behind body text. */}
      <div
        aria-hidden="true"
        className="bg-iris-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 blur-3xl"
      />

      {/* Giant Ghost Anton "POLA" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-10 z-0 flex items-center justify-center select-none"
      >
        <span className="text-line font-['Anton',var(--font-anton),sans-serif] text-[clamp(100px,26vw,380px)] leading-none font-black tracking-tight uppercase">
          POLA
        </span>
      </div>

      <div className="relative z-20 mx-auto max-w-7xl">
        {/* Sticky top progress header */}
        <div className="border-line sticky top-14 z-10 rounded-[18px] border bg-[rgb(251_249_245_/_0.94)] px-6 py-3.5 shadow-[0_4px_18px_rgb(27_28_26_/_0.08)] backdrop-blur-2xl">
          <div className="text-ink-muted flex flex-wrap items-center justify-between gap-3 font-mono text-xs tracking-wider uppercase">
            <span className="flex items-center gap-2 tabular-nums">
              <span className="bg-iris h-2 w-2 rounded-full" />
              Pertanyaan {index + 1} / {session.totalCount}
            </span>
            <span aria-live="polite" className="text-ink font-semibold tabular-nums">
              {saveStatus === "saving" ? "Menyimpan…" : `${answeredCount} tersimpan`}
            </span>
          </div>
          <Progress
            aria-label="Progres asesmen"
            className="bg-line mt-3 h-1.5 rounded-full"
            max={session.totalCount}
            value={answeredCount}
          />
          {modular && question.segmentIndex ? (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
              {session.status !== "paused" ? (
                <Button
                  className="border-line bg-surface text-ink hover:bg-surface-raised rounded-full border"
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

        {/* Main Grid: Left Question, Right Figurine */}
        <div className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {session.status === "paused" ? (
            <div className="bg-surface border-line rounded-[28px] border p-8 text-center shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-12 lg:col-span-12">
              <span className="bg-iris-wash text-iris inline-flex items-center gap-2 rounded-full px-3.5 py-1 font-mono text-[11px] font-bold tracking-wider uppercase">
                <span className="bg-iris h-1.5 w-1.5 rounded-full" />
                Status
              </span>
              <h1
                className="mt-5 text-3xl font-semibold tracking-[-0.025em] outline-none"
                ref={pausedHeadingRef}
                tabIndex={-1}
              >
                Sesi Dijeda
              </h1>
              <p className="text-ink-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
                Progres tersimpan aman. Lanjutkan saat kamu siap — tanpa terburu-buru, tanpa
                tekanan.
              </p>
              <Button
                className="bg-iris text-canvas hover:bg-iris-deep mt-7 rounded-full font-bold shadow-sm"
                onClick={togglePause}
                type="button"
              >
                Lanjutkan
              </Button>
            </div>
          ) : (
            <>
              {/* Question card */}
              <article className="bg-surface border-line rounded-[28px] border p-7 shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-10 lg:col-span-7">
                <h1
                  className="text-2xl leading-snug font-semibold tracking-[-0.025em] outline-none sm:text-3xl"
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
                  <p
                    className="text-danger bg-danger-soft border-danger/20 mt-4 rounded-[12px] border px-3 py-2 text-sm font-semibold"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    className="border-line bg-surface text-ink hover:bg-surface-raised w-full rounded-full border sm:w-auto"
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
                      className="bg-iris text-canvas hover:bg-iris-deep w-full rounded-full font-bold shadow-sm sm:w-auto"
                      disabled={pending}
                      onClick={finish}
                      type="button"
                    >
                      Lihat hasil
                    </Button>
                  ) : (
                    <Button
                      className="border-line bg-surface text-ink hover:bg-surface-raised w-full rounded-full border sm:w-auto"
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

              {/* Right: Cutout Figurine on Stage */}
              <aside
                aria-label="Figurine Karakter"
                className="pointer-events-none relative hidden flex-col items-center justify-end lg:col-span-5 lg:flex"
              >
                <div className="relative flex flex-col items-center justify-end">
                  <div className="bg-iris-wash pointer-events-none absolute h-56 w-56 rounded-full blur-3xl" />
                  <div className="relative h-[440px] w-72">
                    <NextImage
                      src={figureSrc}
                      alt="Figurine Karakter"
                      fill
                      sizes="280px"
                      draggable={false}
                      className="object-contain object-bottom drop-shadow-[0_20px_28px_rgba(0,0,0,0.22)] filter select-none"
                    />
                  </div>
                  <div className="h-4 w-48 rounded-[100%] bg-[#1b1c1a]/18 blur-[4px]" />
                  <div className="border-line bg-surface text-ink-muted mt-4 rounded-full border px-3.5 py-1 font-mono text-[11px] tracking-wide">
                    Figurine Pembawa · Tahap Awal Lensa
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>
        <p className="text-steel mt-6 text-center text-sm leading-6">
          Jawaban tersimpan otomatis per butir. Kamu bebas menjeda atau melanjutkan kapan saja.
        </p>
      </div>
    </section>
  );
}
