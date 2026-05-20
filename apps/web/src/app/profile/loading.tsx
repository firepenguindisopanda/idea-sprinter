export default function ProfileLoading() {
  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8">
      {/* Header skeleton */}
      <div className="border-b border-primary/20 pb-6">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/50 rounded animate-pulse mt-2" />
      </div>

      {/* Profile form skeleton */}
      <div className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 bg-primary/10 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="h-12 w-32 bg-primary/20 rounded animate-pulse" />
      </div>
    </div>
  );
}
