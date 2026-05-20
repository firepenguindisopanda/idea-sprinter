export default function GenerateLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-primary/50 rounded-full animate-pulse" />
            <div className="h-3 w-32 bg-primary/20 rounded animate-pulse" />
          </div>
          <div className="h-10 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-80 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Project Form skeleton */}
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10" />
            <div className="mb-4">
              <div className="h-6 w-56 bg-muted rounded animate-pulse" />
            </div>
            
            <div className="bg-background border-2 border-primary/20 p-6">
              {/* Form fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                  <div className="h-3 w-32 bg-primary/20 rounded animate-pulse" />
                  <div className="h-7 w-24 bg-primary/10 rounded animate-pulse" />
                </div>
                <div className="h-64 bg-muted/30 rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted/20 rounded animate-pulse ml-auto" />
                
                {/* Tech stack toggle */}
                <div className="border-t border-b border-primary/10 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-48 bg-muted/30 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-8 w-24 bg-primary/10 rounded animate-pulse" />
                  </div>
                </div>

                {/* Submit button */}
                <div className="h-14 w-full bg-primary/20 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Pipeline Status & Live Preview skeleton */}
        <div className="space-y-6">
          {/* Agent Pipeline Progress */}
          <div className="border-2 border-primary/20 p-6">
            <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, phase) => (
                <div key={phase} className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-primary/10 rounded animate-pulse" />
                  <div className="h-4 flex-1 bg-muted/30 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="border-2 border-primary/20 p-6">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="h-48 bg-muted/20 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
