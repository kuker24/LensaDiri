"use client";

import { useEffect, useRef, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let triggerEl: HTMLElement | null = null;

    if (open) {
      triggerEl = document.activeElement as HTMLElement;
      if (!node.open) {
        node.showModal();
      }
    } else {
      if (node.open) {
        node.close();
      }
    }

    return () => {
      if (open && triggerEl) {
        triggerEl.focus();
      }
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "border-line bg-canvas text-ink shadow-surface backdrop:bg-ink/40 relative m-auto max-w-md rounded-lg border p-6",
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="focus-ring text-ink-muted hover:bg-mist hover:text-ink absolute top-4 right-4 rounded-sm p-1.5"
        aria-label="Tutup dialog"
      >
        <span aria-hidden="true">✕</span>
      </button>
      <h2 className="font-display pr-8 text-lg font-semibold" id={titleId}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
