import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-lens text-canvas hover:bg-[#bd70ff] active:bg-lens-strong disabled:bg-line disabled:text-ink-muted",
  secondary:
    "border border-white/20 bg-surface text-ink hover:border-white/40 hover:bg-surface-raised active:bg-mist disabled:border-line disabled:text-ink-muted",
  ghost: "text-ink hover:bg-white/8 active:bg-white/12 disabled:text-ink-muted",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3.5 py-2 text-sm",
  md: "min-h-[48px] px-5 py-3 text-sm",
};

export const buttonBaseClass =
  "focus-ring pressable inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[color,background-color,border-color,opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none";

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
