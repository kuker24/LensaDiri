import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "rounded-[2px] border border-[#e2e2e2]/35 bg-charcoal text-ink hover:bg-[#555456] active:bg-[#3a393b] disabled:bg-surface-raised disabled:text-ink-muted",
  secondary:
    "rounded-[2px] border border-[#e2e2e2]/35 bg-canvas text-ink hover:border-[#e2e2e2]/70 hover:bg-white/5 active:bg-white/8 disabled:border-white/15 disabled:text-ink-muted",
  ghost: "rounded-[2px] text-ink hover:bg-white/8 active:bg-white/12 disabled:text-ink-muted",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-4 py-2 font-mono text-[0.625rem] tracking-[-0.02em] uppercase",
  md: "min-h-[48px] px-5 py-3 font-mono text-xs tracking-[-0.02em] uppercase",
};

export const buttonBaseClass =
  "focus-ring pressable inline-flex items-center justify-center gap-2 font-normal transition-[color,background-color,border-color,opacity,transform] duration-200 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none";

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
