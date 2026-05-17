// src/components/workspace/top-bar.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { ExportDropdown } from "./export-dropdown";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PHASE_LABELS: Record<string, string> = {
  idea_input: "Draft",
  clarifying_questions: "Discovery",
  direction_selection: "Direction",
  generating: "Generating",
  refinement: "Ready",
};

export function TopBar() {
  const { phase, projectTitle, documentSections, selectedDirectionId, setProjectTitle, setSavedProjectId, savedProjectId } = useWorkspace();
  const stageLabel = PHASE_LABELS[phase] ?? "Workspace";
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const completedSections = documentSections.filter((s) => s.status === "complete");
    if (completedSections.length === 0) {
      toast.info("Nothing to save", { description: "Generate document sections first." });
      return;
    }

    const title = projectTitle || "Untitled Specification";
    setIsSaving(true);
    try {
      const saved = await api.saveWorkspace({
        title,
        direction_id: selectedDirectionId,
        brief: "",
        sections: completedSections.map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          order: s.order,
        })),
      });
      setSavedProjectId(saved.id);
      setProjectTitle(saved.title);
      toast.success("Saved", { description: `"${saved.title}" saved to your projects.` });
    } catch {
      toast.error("Save failed", { description: "Could not save the specification. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
            {projectTitle || "New Project"}
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary">
            {stageLabel}
          </span>
          {savedProjectId && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600">
              <Save className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(phase === "generating" || phase === "refinement") && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
            </Button>
          )}
          <ExportDropdown />
        </div>
      </div>
    </header>
  );
}
