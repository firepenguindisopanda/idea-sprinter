export default function GenerateSessionLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary/10 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-primary/20 rounded animate-pulse" />
          <div className="h-10 w-24 bg-primary/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Results content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tabs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
          
          {/* Summary card */}
          <div className="mt-6 p-4 border-2 border-primary/20 bg-background/50">
            <div className="h-5 w-24 bg-primary/10 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-8 bg-primary/20 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Document viewer */}
        <div className="lg:col-span-2">
          <div className="h-96 border-2 border-primary/20 bg-background/50 p-6">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-1/3 bg-primary/10 rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
