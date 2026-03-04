"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ProjectDetailError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="size-10 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">
          Failed to load project
        </h1>
      </div>

      <p className="text-muted-foreground max-w-md mb-6">
        This project could not be loaded. It may have been deleted or there
        was a network issue.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
