"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
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
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (open) {
      if (!node.open) {
        triggerRef.current = document.activeElement as HTMLElement | null;
        node.showModal();
      }
      return;
    }

    if (node.open) node.close();
    if (triggerRef.current?.isConnected) triggerRef.current.focus();
    triggerRef.current = null;
  }, [open]);

  useEffect(() => {
    return () => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
    };
  }, []);

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
      onClose={() => {
        if (open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]',
          ),
        ).filter((element) => element.tabIndex >= 0 && !element.closest("[inert]"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="focus-ring text-ink-muted hover:bg-mist hover:text-ink absolute top-2 right-2 inline-flex min-h-12 min-w-12 items-center justify-center rounded-sm"
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
