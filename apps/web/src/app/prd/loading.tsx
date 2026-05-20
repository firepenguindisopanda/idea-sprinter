export default function PrdLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div className="space-y-2">
          <div className="h-10 w-72 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-primary/10 border border-primary/20 rounded animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Chat */}
        <div className="space-y-4">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-96 border-2 border-primary/20 bg-background/50">
            <div className="h-full p-4 space-y-4">
              {/* Chat messages skeleton */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`h-20 ${i % 2 === 0 ? 'w-3/4' : 'w-1/2'} bg-primary/10 rounded-lg animate-pulse`} />
                </div>
              ))}
            </div>
          </div>
          <div className="h-14 w-full bg-muted/30 rounded animate-pulse" />
        </div>

        {/* Right: Status & Document */}
        <div className="space-y-6">
          {/* Status */}
          <div className="h-48 border-2 border-primary/20 bg-background/50 p-4">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-primary/10 rounded animate-pulse" />
                  <div className="h-3 flex-1 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Document preview */}
          <div className="h-64 border-2 border-primary/20 bg-background/50 p-4">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 bg-muted/30 rounded animate-pulse" style={{ width: i % 2 === 0 ? '80%' : '65%' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
