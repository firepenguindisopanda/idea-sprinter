"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles } from "lucide-react";
import { runWorkspaceGeneration } from "@/lib/workspace-generate";

const CUSTOM_DIRECTION_ID = "custom";

export function DirectionSelector() {
  const { directions, selectDirection, addDirection } = useWorkspace();
  const [isDescribing, setIsDescribing] = useState(false);
  const [customDirection, setCustomDirection] = useState("");

  const handleSelect = async (directionId: string) => {
    selectDirection(directionId);
    await runWorkspaceGeneration(directionId);
  };

  /**
   * "Describe my own" was a button with no handler - the one escape hatch from
   * three generated options did nothing when clicked. The custom direction is
   * added to the list like any other so `buildBrief` picks it up; it is the
   * brief that steers generation, not the id.
   */
  const handleCustomSubmit = async () => {
    const description = customDirection.trim();
    if (!description) return;
    addDirection({
      id: CUSTOM_DIRECTION_ID,
      title: "My own direction",
      description,
      tags: ["custom"],
    });
    await handleSelect(CUSTOM_DIRECTION_ID);
  };

  if (directions.length === 0) {
    return (
      <div className="rounded-sm border border-primary/25 bg-card p-6 text-sm text-muted-foreground text-center">
        Analyzing your answers to suggest directions...
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-primary/25 bg-card p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Possible Directions
        </h2>
        <p className="text-sm text-muted-foreground">
          Based on your brief, here are some ways to approach this project.
        </p>
      </div>

      <div className="grid gap-4">
        {directions.map((dir) => (
          <button
            key={dir.id}
            onClick={() => handleSelect(dir.id)}
            className="stamp-hover group text-left rounded-sm border border-border bg-card p-5 hover:border-primary/40 hover:bg-primary/[0.02]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {dir.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dir.description}
                </p>
                {dir.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dir.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* Custom / Hybrid option */}
      {isDescribing ? (
        <div className="space-y-3">
          <label htmlFor="custom-direction" className="block text-sm font-medium text-foreground">
            Describe the direction you want
          </label>
          <Textarea
            id="custom-direction"
            autoFocus
            value={customDirection}
            onChange={(e) => setCustomDirection(e.target.value)}
            placeholder="e.g. A single-tenant internal tool, optimised for speed of delivery over extensibility."
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCustomSubmit}
              disabled={!customDirection.trim()}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Generate with this
            </Button>
            <Button variant="ghost" onClick={() => setIsDescribing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Button
            variant="ghost"
            className="gap-2 text-sm text-muted-foreground"
            onClick={() => setIsDescribing(true)}
          >
            <Sparkles className="h-4 w-4" />
            I want something different - describe my own
          </Button>
        </div>
      )}
    </div>
  );
}
