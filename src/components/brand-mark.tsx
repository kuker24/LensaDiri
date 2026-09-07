import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  /** Accessible name when the mark is not paired with visible “LensaDiri” text. */
  title?: string;
};

/**
 * LensaDiri constellation lens mark (Dala world: void rings, iris core, saffron spark).
 * Rings inherit text color; the core and spark carry the brand accents.
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
      <circle cx="16" cy="16" opacity="0.9" r="11.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" opacity="0.45" r="7.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="16" cy="16" fill="#8052ff" r="3.4" />
      <path d="M24.6 7.4l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1z" fill="#ffb829" />
    </svg>
  );
}
