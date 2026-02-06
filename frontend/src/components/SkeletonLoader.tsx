export const SkeletonLoader = ({ count = 3, height = "h-20" }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`${height} bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-lg animate-pulse`}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-slate-800 rounded-lg p-4 space-y-3 animate-pulse">
    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
    <div className="h-3 bg-slate-700 rounded"></div>
    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
