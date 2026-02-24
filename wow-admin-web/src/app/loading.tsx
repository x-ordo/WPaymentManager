export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-28" />
      </div>

      {/* Summary cards skeleton */}
      <div className="stats stats-horizontal shadow w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="stat">
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="skeleton h-6 w-32" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card card-border bg-base-100 overflow-hidden">
        <div className="skeleton h-10 w-full rounded-none" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-base-200">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
