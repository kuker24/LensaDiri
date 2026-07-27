import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  /** Accessible name when the mark is not paired with visible “LensaDiri” text. */
  title?: string;
};

/**
 * LensaDiri monochrome lens mark (Design2: void + frost aperture rings).
 * Uses currentColor so it inherits text color in the shell.
 */
export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <circle cx="16" cy="16" opacity="0.95" r="11.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" opacity="0.55" r="7.25" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="16" cy="16" fill="currentColor" r="3.1" />
      <path
        d="M12.2 12.1c1.4-1.3 3.3-1.9 5.1-1.6"
        opacity="0.45"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1"
      />
    </svg>
  );
}
