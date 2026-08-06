import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ConceptSkeletonCard() {
  return (
    <Card className="rounded-none bg-background/40 border-2 border-primary/10 flex flex-col group relative overflow-hidden h-full min-h-[350px]">
      <div className="absolute top-0 right-0 p-2">
        <Skeleton className="h-3 w-16 bg-primary/10" />
      </div>
      
      <CardHeader className="border-b border-primary/5 bg-primary/[0.01]">
        <Skeleton className="h-6 w-3/4 mb-2 bg-primary/10" />
        <Skeleton className="h-3 w-full bg-primary/5" />
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4 p-6 font-sans">
        {/* Scope Bullets */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary/80 mt-0.5">»</span>
              <Skeleton className="h-3 w-full bg-primary/5" />
            </div>
          ))}
        </div>
        
        {/* Full Text Preview */}
        <div className="p-4 bg-primary/[0.01] mt-4 space-y-2">
          <Skeleton className="h-2 w-full bg-primary/5" />
          <Skeleton className="h-2 w-5/6 bg-primary/5" />
          <Skeleton className="h-2 w-4/6 bg-primary/5" />
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-primary/5 bg-primary/[0.01] flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 bg-primary/10" />
          <Skeleton className="h-8 w-16 bg-primary/5" />
          <Skeleton className="h-8 w-16 bg-primary/5" />
        </div>
        
        {/* Tags */}
        <div className="flex gap-1">
          <Skeleton className="h-4 w-12 bg-primary/10" />
          <Skeleton className="h-4 w-12 bg-primary/10" />
        </div>
      </CardFooter>
    </Card>
  );
}
