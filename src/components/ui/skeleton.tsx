import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-3 border-b border-border flex gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-3 w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-3 border-b border-border last:border-0 flex gap-6 items-center">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20 ml-auto" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
