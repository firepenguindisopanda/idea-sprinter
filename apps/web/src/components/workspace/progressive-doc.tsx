"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { resumeWorkspaceGeneration, runWorkspaceGeneration } from "@/lib/workspace-generate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, RotateCw } from "lucide-react";
import { DocSection } from "./doc-section";

export function ProgressiveDoc() {
  const { documentSections, phase, selectedDirectionId, setPhase } = useWorkspace();
  const isDesign = useWorkspaceStore((s) => s.design !== null || s.designProgress !== null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const resumeAttempted = useRef(false);

  // A reload lands here on `interrupted`, because the store cannot know whether
  // the run is still alive. Ask: a twelve-agent pipeline usually is, and
  // rejoining it is worth far more than offering to pay for it twice. Once per
  // mount - a failed attempt must not become a loop.
  useEffect(() => {
    if (phase !== "interrupted" || resumeAttempted.current) return;
    resumeAttempted.current = true;
    const runId = useWorkspaceStore.getState().runId;
    if (!runId) return;

    // Kicked off after the effect body rather than inside it, and guarded by
    // the cleanup: setting state synchronously here cascades a render, and an
    // unmount mid-reconnect would otherwise set state on a gone component.
    let live = true;
    void Promise.resolve().then(async () => {
      if (!live) return;
      setIsResuming(true);
      try {
        await resumeWorkspaceGeneration();
      } finally {
        if (live) setIsResuming(false);
      }
    });
    return () => {
      live = false;
    };
  }, [phase]);

  const sorted = [...documentSections].sort((a, b) => a.order - b.order);

  const handleRetry = async () => {
    if (!selectedDirectionId) return;
    setIsRetrying(true);
    // Drop the partial sections - the pipeline re-emits them from the start,
    // and keeping them would interleave two runs of the same document.
    useWorkspaceStore.setState({ documentSections: [], refinementHistory: [] });
    await runWorkspaceGeneration(selectedDirectionId);
    setIsRetrying(false);
  };

  return (
    <div className="sheet-frame mx-auto min-h-full max-w-3xl px-8 py-12 lg:px-12">
      {/* `isResuming` is checked before `phase`, not alongside it: rejoining
          moves the phase to "generating" as its first act, so a banner gated on
          the interrupted phase could never appear. */}
      {isResuming && (
        <div className="label-xs mb-8 flex items-center gap-2 text-primary">
          <RotateCw className="h-3 w-3 animate-spin" />
          Reconnecting to a run that is still going
        </div>
      )}

      {phase === "generating" && !isResuming && (
        <div className="label-xs mb-8 flex items-center gap-2 text-primary">
          <span className="pulse-rule inline-block h-2 w-2 bg-primary" />
          Drafting the specification
        </div>
      )}

      {phase === "interrupted" && !isResuming && (
        <div className="accent-note mb-8 border-destructive bg-destructive/10 p-4 space-y-3">
          <p className="text-sm text-foreground">
            {sorted.length > 0
              ? "Generation stopped before the document was finished. What arrived is below."
              : "Generation stopped before any sections arrived."}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedDirectionId && (
              <Button size="sm" onClick={handleRetry} disabled={isRetrying} className="gap-2">
                <RotateCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Regenerating..." : "Regenerate"}
              </Button>
            )}
            {sorted.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPhase("refinement")}
                disabled={isRetrying}
              >
                Keep what I have
              </Button>
            )}
          </div>
        </div>
      )}

      {/* The spec is finished; the architecture decision is what comes next,
          and `/architecture` used to be reachable only by retyping the
          requirements from scratch. The spec hands itself over. */}
      {phase === "refinement" && sorted.some((s) => s.status === "complete") && (
        <div className="mb-8 flex items-center justify-between gap-3 rounded-sm border border-primary/25 bg-primary/5 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Ready to choose an architecture?</p>
            <p className="text-xs text-muted-foreground">
              Carries this specification over as the requirements.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-2 shrink-0">
            <Link href="/architecture?from=workspace">
              <Compass className="h-4 w-4" />
              Design the architecture
            </Link>
          </Button>
        </div>
      )}

      {sorted.length === 0 ? (
        // The sheet before anything is drawn on it. This was set in font-serif,
        // a family the system does not have and never loads.
        <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
          <span className="label-xs text-muted-foreground">Sheet 1 - empty</span>
          <h1 className="text-2xl font-bold tracking-tight text-muted-foreground">
            Untitled specification
          </h1>
          {/* No "on the left" - below 1024px the console stacks above this. */}
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Answer the clarifying questions, then pick a direction. Sections
            appear here as each agent finishes one.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {sorted.map((section) => (
            <DocSection
              key={section.id}
              section={section}
              // Not on a design: its status says what was checked, and a
              // refined section is text no check saw. Until a refined section
              // can be re-checked, the status stays true by not offering it.
              isRefinementMode={phase === "refinement" && !isDesign}
            />
          ))}
        </div>
      )}
    </div>
  );
}
