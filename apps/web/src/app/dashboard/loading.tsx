export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-10">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
            <div className="h-3 w-24 bg-primary/20 rounded animate-pulse" />
          </div>
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="h-12 w-36 bg-primary/20 rounded animate-pulse" />
      </div>

      {/* Usage Stats skeleton */}
      <div className="relative">
        <div className="absolute top-0 right-0 p-2">
          <div className="h-3 w-12 bg-primary/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 border border-primary/10 bg-background/50 p-4">
              <div className="h-3 w-16 bg-primary/10 rounded animate-pulse mb-2" />
              <div className="h-8 w-12 bg-primary/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Projects skeleton */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-24 bg-primary/30 rounded animate-pulse" />
          <div className="h-px flex-1 bg-primary/10" />
          <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 border-2 border-primary/10 bg-background/50 p-6">
              <div className="h-6 w-3/4 bg-primary/10 rounded animate-pulse mb-4" />
              <div className="h-3 w-full bg-muted/30 rounded animate-pulse mb-2" />
              <div className="h-3 w-2/3 bg-muted/30 rounded animate-pulse mb-4" />
              <div className="flex gap-2 mt-auto">
                <div className="h-8 w-20 bg-primary/10 rounded animate-pulse" />
                <div className="h-8 w-20 border border-primary/20 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
