import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-line/60 animate-pulse rounded-sm motion-reduce:animate-none", className)}
    />
  );
}
