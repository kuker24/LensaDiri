import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export const variantStyles: Record<ButtonVariant, string> = {
  /* Dala: one violet pill for the primary action; hairline ghost for the rest */
  primary:
    "rounded-pill border border-iris bg-iris text-white shadow-none hover:bg-iris-deep hover:border-iris-deep active:bg-iris-deep/90 disabled:bg-surface-raised disabled:text-ink-muted disabled:border-line",
  secondary:
    "rounded-[12px] border border-white/20 bg-transparent text-ink hover:border-white/45 hover:bg-white/5 active:bg-white/8 disabled:border-white/12 disabled:text-ink-muted",
  ghost: "rounded-[12px] text-ink hover:bg-white/8 active:bg-white/12 disabled:text-ink-muted",
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
