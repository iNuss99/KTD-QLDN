// Skeleton Loaders — dùng animate-pulse để hiển thị trạng thái loading

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-200 rounded animate-pulse flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 px-4 py-3.5 border-b border-slate-50 last:border-none"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 bg-slate-100 rounded animate-pulse flex-1"
              style={{ animationDelay: `${(rowIdx * cols + colIdx) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-9 w-9 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
      <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded animate-pulse" />
      <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
    </div>
  );
}

interface SkeletonKPIGridProps {
  count?: number;
}

export function SkeletonKPIGrid({ count = 4 }: SkeletonKPIGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKPI key={i} />
      ))}
    </div>
  );
}
