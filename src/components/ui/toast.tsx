"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastTone = "neutral" | "success" | "danger";
type ToastItem = { id: number; message: string; tone: ToastTone };

const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);

export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast must be used within ToastProvider");
  return push;
}

const toneStyles: Record<ToastTone, string> = {
  neutral: "border-line bg-canvas text-ink",
  success: "border-line bg-canvas text-success",
  danger: "border-danger-soft bg-danger-soft text-danger",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "neutral") => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "shadow-surface pointer-events-auto animate-[toast-in_200ms_ease-out] rounded-md border px-4 py-2.5 text-sm",
              toneStyles[item.tone],
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
