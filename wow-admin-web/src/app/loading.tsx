export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-surface-muted rounded" />
        <div className="h-4 w-28 bg-surface-muted rounded" />
      </div>

      {/* Summary cards skeleton */}
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 bg-surface-card border border-border-default rounded-lg shadow-xs overflow-hidden">
            <div className="flex">
              <div className="w-1 bg-surface-muted shrink-0" />
              <div className="p-4 flex-1 space-y-2">
                <div className="h-3 w-20 bg-surface-muted rounded" />
                <div className="h-6 w-32 bg-surface-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-surface-card border border-border-default shadow-xs rounded-lg overflow-hidden">
        <div className="bg-surface-muted h-10 border-b border-border-default" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border-subtle">
            <div className="h-4 w-28 bg-surface-muted rounded" />
            <div className="h-4 w-20 bg-surface-muted rounded" />
            <div className="h-4 w-24 bg-surface-muted rounded" />
            <div className="h-4 w-16 bg-surface-muted rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
