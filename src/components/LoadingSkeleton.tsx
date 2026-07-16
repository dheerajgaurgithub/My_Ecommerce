export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-8" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-32" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
      </div>
      <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex gap-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded flex-1" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded flex-1" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded flex-1" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
      </div>
      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
    </div>
  );
}
