"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="size-10 text-destructive" />
        <h1 className="text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
      </div>

      <p className="text-muted-foreground max-w-md mb-2">
        An unexpected error occurred while rendering this page. You can try
        again or return to the home page.
      </p>

      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono mb-6">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
