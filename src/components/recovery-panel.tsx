"use client";

import Link from "next/link";

import { Button, getButtonClassName } from "@/components/ui/button";

interface RecoveryPanelProps {
  description: string;
  eyebrow?: string;
  onRetry?: () => void;
  reassurance?: string;
  reload?: boolean;
  safeHref?: string;
  safeLabel?: string;
  title: string;
}

export function RecoveryPanel({
  description,
  eyebrow = "Belum dapat dimuat",
  onRetry,
  reassurance,
  reload = false,
  safeHref = "/",
  safeLabel = "Kembali ke beranda",
  title,
}: RecoveryPanelProps) {
  return (
    <section className="surface-panel mx-auto my-12 max-w-3xl p-7 sm:my-16 sm:p-10" role="alert">
      <p className="mono-label text-danger">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <p className="text-ink-muted mt-4 max-w-2xl leading-7">{description}</p>
      {reassurance ? <p className="text-ink-muted mt-3 text-sm">{reassurance}</p> : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {onRetry || reload ? (
          <Button onClick={onRetry ?? (() => window.location.reload())}>Coba lagi</Button>
        ) : null}
        <Link
          className={getButtonClassName(onRetry || reload ? "secondary" : "primary")}
          href={safeHref}
        >
          {safeLabel}
        </Link>
      </div>
    </section>
  );
}
