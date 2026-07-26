import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="container-shell py-16" aria-label="Memuat halaman" role="status">
      <span className="sr-only">Memuat halaman…</span>
      <div aria-hidden="true" className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 max-w-xl" />
        <Skeleton className="h-24 max-w-2xl" />
        <Skeleton className="h-48 rounded-[10px]" />
      </div>
    </section>
  );
}
