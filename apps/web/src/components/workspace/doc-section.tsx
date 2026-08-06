"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import type { DocSection as DocSectionType } from "@/types/workspace";
import { Button } from "@/components/ui/button";
import { Wand2, Undo2 } from "lucide-react";
import { api } from "@/lib/api";
import { Markdown } from "@/components/markdown";

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
      const response = await api.refineSection(
        section.id,
        section.content,
        refinePrompt.trim(),
      );
      applyRefinement({
        sectionId: section.id,
        prompt: refinePrompt.trim(),
        originalContent: section.content,
        suggestedContent: response.content ?? section.content,
        applied: true,
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }

    setIsRefining(false);
    setRefinePrompt("");
    setShowRefine(false);
  };

  const statusIcon = (() => {
    if (section.status === "generating") {
      return (
        <span className="pulse-rule inline-block h-2 w-2 bg-primary" />
      );
    }
    if (section.status === "pending") {
      return (
        <span className="inline-block h-2 w-2 border border-muted-foreground/40" />
      );
    }
    return (
      <span className="inline-block h-2 w-2 bg-tertiary" />
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
            className="h-8 w-8 rounded-sm bg-card"
            title="Refine section"
          >
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          {lastRefinement && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => undoRefinement(section.id)}
              className="h-8 w-8 rounded-sm bg-card"
              title="Undo refinement"
            >
              <Undo2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground">
          {statusIcon}
          {section.title}
        </h2>
      </div>

      {section.content ? (
        <Markdown
          isStreaming={section.status === "generating"}
          enableDiagrams
          className="max-w-none text-muted-foreground"
        >
          {section.content}
        </Markdown>
      ) : section.status === "generating" ? (
        <div className="space-y-3">
          <div className="h-3 w-full animate-pulse bg-muted/60" />
          <div className="h-3 w-5/6 animate-pulse bg-muted/60" />
          <div className="h-3 w-4/6 animate-pulse bg-muted/60" />
        </div>
      ) : (
        <div className="label-xs text-muted-foreground">Queued</div>
      )}

      {isRefinementMode && showRefine && (
        <div className="mt-6 space-y-3 rounded-sm border border-primary/25 bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            How would you like to refine this section?
          </p>
          <div className="flex items-start gap-2">
            <textarea
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="e.g., Make this more technical, Add pricing details, Simplify the language..."
              rows={2}
              className="flex-1 resize-none rounded-sm border border-input bg-surface-sunken/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                  className="label-xs rounded-xs border border-border bg-card px-2 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
