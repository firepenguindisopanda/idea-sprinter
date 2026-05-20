export default function ArchitectureLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
            <div className="h-3 w-40 bg-purple-500/20 rounded animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-80 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Session */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-80 border-2 border-purple-500/20 bg-background/50 p-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-purple-500/10 rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
              <div className="h-12 w-full bg-purple-500/20 rounded animate-pulse mt-6" />
            </div>
          </div>
        </div>

        {/* Right: Options */}
        <div className="space-y-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 border-2 border-purple-500/20 bg-background/50 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-5 w-32 bg-purple-500/10 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-purple-500/20 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-3 bg-muted/30 rounded animate-pulse" style={{ width: j % 2 === 0 ? '85%' : '70%' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
