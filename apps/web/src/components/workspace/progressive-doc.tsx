"use client";

import { useWorkspace } from "@/hooks/use-workspace";
import { DocSection } from "./doc-section";

export function ProgressiveDoc() {
  const { documentSections, phase } = useWorkspace();

  const sorted = [...documentSections].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl mx-auto py-12 px-8 lg:px-16 min-h-full">
      {phase === "generating" && (
        <div className="flex items-center gap-2 text-sm text-primary mb-8">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Building your specification...
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-4">
          <h1 className="text-3xl font-serif text-muted-foreground/30">Untitled Specification</h1>
          <p className="text-sm text-muted-foreground/50 max-w-md">
            Your document will be generated here once you select a direction.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {sorted.map((section) => (
            <DocSection
              key={section.id}
              section={section}
              isRefinementMode={phase === "refinement"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
