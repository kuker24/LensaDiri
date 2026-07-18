import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-lens text-canvas hover:bg-lens-strong active:bg-lens-strong disabled:bg-ink-muted disabled:text-canvas/60",
  secondary:
    "border border-line bg-transparent text-ink hover:bg-mist active:bg-mist disabled:border-line/60 disabled:text-ink-muted",
  ghost: "text-ink hover:bg-mist active:bg-mist disabled:text-ink-muted",
};

export const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm min-h-[44px]",
  md: "px-5 py-3 text-sm min-h-[44px]",
};

export const buttonBaseClass =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-[color,background-color,border-color,transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

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
