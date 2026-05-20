import { Loader2 } from "lucide-react";

export default function IdeationLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-12">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
            <div className="h-3 w-36 bg-amber-500/20 rounded animate-pulse" />
          </div>
          <div className="h-10 w-56 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted/50 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-amber-500/10 border border-amber-500/30 rounded animate-pulse" />
          <div className="h-10 w-36 bg-primary/10 border border-primary/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Ideation Wizard skeleton */}
      <div className="relative group">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500/20" />
        <div className="mb-6">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-3 w-64 bg-muted/30 rounded animate-pulse mt-1" />
        </div>

        <div className="bg-background border-2 border-amber-500/20 p-6">
          <div className="space-y-6">
            {/* Form fields */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 bg-amber-500/10 rounded animate-pulse" />
                <div className="h-10 w-full bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
            
            <div className="h-10 w-full bg-amber-500/20 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Generated Examples skeleton */}
      <div className="relative group">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500/20" />
        <div className="mb-6">
          <div className="h-6 w-56 bg-muted rounded animate-pulse" />
          <div className="h-3 w-72 bg-muted/30 rounded animate-pulse mt-1" />
        </div>

        <div className="border-2 border-dashed border-amber-500/30 p-12 flex flex-col items-center justify-center gap-4 bg-amber-500/5">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <div className="text-center">
            <div className="h-4 w-48 bg-amber-500/20 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
