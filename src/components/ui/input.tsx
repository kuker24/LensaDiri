import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-ink mb-1.5 block text-sm font-medium", className)} {...props} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring border-line bg-canvas text-ink placeholder:text-ink-muted w-full rounded-sm border px-3.5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60",
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
        "focus-ring border-line bg-canvas text-ink placeholder:text-ink-muted w-full rounded-sm border px-3.5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-ink-muted mt-1.5 text-xs">{children}</p>;
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-danger mt-1.5 text-xs font-medium">
      {children}
    </p>
  );
}
