import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Task 39 — Các skeleton chuẩn dùng cho danh sách / drawer / thẻ.

export function TableSkeleton({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải danh sách"
      className={cn("space-y-2", className)}
    >
      <div className="flex gap-3 border-b pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-3 py-1.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DrawerSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải chi tiết"
      className={cn("space-y-4 p-4", className)}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}

export function ListSkeleton({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải"
      className={cn("space-y-2", className)}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border p-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  items = 6,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Đang tải"
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-8 w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}
