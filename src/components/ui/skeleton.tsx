import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-line/70 animate-pulse rounded-md motion-reduce:animate-none", className)}
    />
  );
}
