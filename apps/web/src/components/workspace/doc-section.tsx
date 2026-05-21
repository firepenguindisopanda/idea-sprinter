"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import type { DocSection as DocSectionType } from "@/types/workspace";
import { Button } from "@/components/ui/button";
import { Wand2, Undo2 } from "lucide-react";
import { api } from "@/lib/api";

interface DocSectionProps {
  section: DocSectionType;
  isRefinementMode: boolean;
}

export function DocSection({ section, isRefinementMode }: DocSectionProps) {
  const { applyRefinement, undoRefinement, refinementHistory, setError } = useWorkspace();
  const [showRefine, setShowRefine] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [_isRefining, setIsRefining] = useState(false);

  const lastRefinement = [...refinementHistory]
    .reverse()
    .find((r) => r.sectionId === section.id);

  const handleRefine = async () => {
    if (!refinePrompt.trim()) return;
    setIsRefining(true);

    try {
      const response = await api.refineSection(section.id, refinePrompt.trim());
      applyRefinement({
        sectionId: section.id,
        prompt: refinePrompt.trim(),
        originalContent: section.content,
        suggestedContent: response.content ?? section.content,
        applied: true,
      });
    } catch {
      setError("Unable to connect to the backend at localhost:5001. Make sure the server is running.");
    }

    setIsRefining(false);
    setRefinePrompt("");
    setShowRefine(false);
  };

  const statusIcon = (() => {
    if (section.status === "generating") {
      return (
        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
      );
    }
    if (section.status === "pending") {
      return (
        <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30" />
      );
    }
    return (
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
    );
  })();

  return (
    <div
      className="group relative transition-all"
      onMouseEnter={() => isRefinementMode && setShowRefine(true)}
      onMouseLeave={() => {
        if (!refinePrompt) setShowRefine(false);
      }}
    >
      {/* Floating Toolbar */}
      {isRefinementMode && section.status === "complete" && (
        <div
          className={`absolute -right-4 md:-right-12 top-0 flex flex-col gap-1 transition-opacity ${
            showRefine ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowRefine(true)}
            className="h-8 w-8 rounded-full shadow-sm bg-background"
            title="Refine section"
          >
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          {lastRefinement && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => undoRefinement(section.id)}
              className="h-8 w-8 rounded-full shadow-sm bg-background"
              title="Undo refinement"
            >
              <Undo2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
          {statusIcon}
          {section.title}
        </h2>
      </div>

      {section.content ? (
        <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {section.content}
        </div>
      ) : section.status === "generating" ? (
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-muted/50 rounded animate-pulse" />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground/30 italic">
          Waiting to generate...
        </div>
      )}

      {isRefinementMode && showRefine && (
        <div className="mt-6 p-4 rounded-xl border border-border bg-muted/30 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            How would you like to refine this section?
          </p>
          <div className="flex items-start gap-2">
            <textarea
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g., Make this more technical, Add pricing details, Simplify the language..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={handleRefine}
                disabled={!refinePrompt.trim() || _isRefining}
                className="h-8 text-xs gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Apply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRefine(false);
                  setRefinePrompt("");
                }}
                className="h-8 text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["Make this clearer", "Add more detail", "Make it more technical"].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setRefinePrompt(suggestion)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-background border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  {suggestion}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
