import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-lens text-white shadow-[0_10px_15px_-3px_rgb(139_92_246_/_0.2),0_4px_6px_-4px_rgb(139_92_246_/_0.2)] hover:bg-lens-strong active:bg-lens-strong disabled:bg-ink-muted disabled:text-white/60",
  secondary:
    "border border-line bg-white/70 text-ink hover:border-lens/30 hover:bg-white active:bg-white disabled:border-line/60 disabled:text-ink-muted",
  ghost: "text-ink hover:bg-lens-soft/70 active:bg-lens-soft disabled:text-ink-muted",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3.5 py-2 text-sm",
  md: "min-h-[48px] px-5 py-3 text-sm",
};

export const buttonBaseClass =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[color,background-color,border-color,box-shadow,opacity] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60";

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
