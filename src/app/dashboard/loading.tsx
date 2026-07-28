import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <section className="task-shell" aria-label="Memuat ruang pribadi" role="status">
      <span className="sr-only">Memuat ruang pribadi…</span>
      <div aria-hidden="true" className="space-y-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 max-w-xl" />
        <Skeleton className="h-24 max-w-2xl" />
        <Skeleton className="h-48 rounded-[16px]" />
      </div>
    </section>
  );
}
