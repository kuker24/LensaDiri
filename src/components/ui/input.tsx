import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-ink mb-1.5 block text-sm font-semibold", className)} {...props} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring border-line bg-surface-raised text-ink placeholder:text-ink-muted focus:border-aperture/70 min-h-11 w-full rounded-md border px-3.5 py-2.5 text-base transition-[border-color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring border-line bg-surface-raised text-ink placeholder:text-ink-muted focus:border-aperture/70 min-h-11 w-full rounded-md border px-3.5 py-2.5 text-base transition-[border-color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-ink-muted mt-1.5 text-xs leading-5">{children}</p>;
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs leading-5 font-semibold">
      {children}
    </p>
  );
}
