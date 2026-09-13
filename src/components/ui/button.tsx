import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

/* Paper theme: borders are ink-alpha, not white-alpha. On `#fbf9f5` a
   `border-white/20` is invisible, so every outline uses the line token. */
export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-full border border-iris bg-iris text-canvas shadow-[0_4px_14px_rgb(157_66_35_/_0.28)] hover:bg-iris-deep hover:border-iris-deep active:bg-iris-deep disabled:bg-surface-raised disabled:text-ink-muted disabled:border-line disabled:shadow-none",
  secondary:
    "rounded-full border border-line bg-surface text-ink hover:border-iris/45 hover:bg-surface-raised active:bg-line disabled:border-line disabled:text-ink-muted",
  ghost: "rounded-full text-ink hover:bg-surface-raised active:bg-line disabled:text-ink-muted",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-4 py-2 text-sm font-medium tracking-[-0.01em]",
  md: "min-h-[48px] px-5 py-3 text-sm font-semibold tracking-[-0.01em]",
};

/* Motion: .pressable owns press scale + token transitions (see globals.css) */
export const buttonBaseClass =
  "focus-ring pressable inline-flex items-center justify-center gap-2 font-sans disabled:cursor-not-allowed disabled:opacity-60";

export function getButtonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(buttonBaseClass, variantStyles[variant], sizeStyles[size]);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(getButtonClassName(variant, size), className)} {...props} />
  );
}
