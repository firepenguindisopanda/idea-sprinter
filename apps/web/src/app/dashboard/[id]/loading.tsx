export default function ProjectDetailLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary/10 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-3 w-40 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-primary/20 rounded animate-pulse" />
          <div className="h-10 w-28 bg-destructive/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Project details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata card */}
          <div className="p-4 border border-primary/20 bg-background/50">
            <div className="h-5 w-24 bg-primary/10 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack card */}
          <div className="p-4 border border-primary/20 bg-background/50">
            <div className="h-5 w-20 bg-primary/10 rounded animate-pulse mb-4" />
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 w-20 bg-primary/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* Main content: Document viewer */}
        <div className="lg:col-span-3">
          <div className="h-[600px] border-2 border-primary/20 bg-background/50 p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-1/4 bg-primary/10 rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
