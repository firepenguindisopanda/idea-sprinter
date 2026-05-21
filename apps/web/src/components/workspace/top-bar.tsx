"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { ExportDropdown } from "./export-dropdown";
import { Button } from "@/components/ui/button";
import { Save, Loader2, PencilLine, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PHASE_LABELS: Record<string, string> = {
  idea_input: "Draft",
  clarifying_questions: "Discovery",
  direction_selection: "Direction",
  generating: "Generating",
  refinement: "Ready",
};

function autoGenerateTitle(ideaInput: string, sections: { title: string; content: string }[]): string {
  if (sections.length > 0) {
    const firstSection = sections[0].content.slice(0, 200);
    const titleMatch = firstSection.match(/^#\s+(.+)/m);
    if (titleMatch) return titleMatch[1].trim();
    const nameMatch = firstSection.match(/(?:project|app|system|platform|tool|service)\s+(?:called|named)?\s*[‘"']?([A-Z][A-Za-z0-9\s]{2,40})/i);
    if (nameMatch) return nameMatch[1].trim();
  }
  const words = ideaInput.split(/\s+/).slice(0, 8);
  if (words.length <= 3) return ideaInput;
  return words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");
}

export function TopBar() {
  const { phase, projectTitle, ideaInput, documentSections, selectedDirectionId, setProjectTitle, setSavedProjectId, savedProjectId } = useWorkspace();
  const stageLabel = PHASE_LABELS[phase] ?? "Workspace";
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!projectTitle && phase === "refinement" && documentSections.length > 0) {
      const generated = autoGenerateTitle(ideaInput, documentSections);
      if (generated) setProjectTitle(generated);
    }
  }, [phase, documentSections, ideaInput, projectTitle, setProjectTitle]);

  const startEditing = () => {
    setEditValue(projectTitle || "");
    setEditing(true);
  };

  const confirmEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed) setProjectTitle(trimmed);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    const completedSections = documentSections.filter((s) => s.status === "complete");
    if (completedSections.length === 0) {
      toast.info("Nothing to save", { description: "Generate document sections first." });
      return;
    }

    const title = projectTitle || autoGenerateTitle(ideaInput, completedSections) || "Untitled Specification";
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
        <div className="flex items-center gap-3 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="h-7 rounded-md border border-input bg-background px-2 text-sm font-semibold text-foreground w-56 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Project name..."
              />
              <button onClick={confirmEdit} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={cancelEdit} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="group flex items-center gap-1.5 max-w-[240px]"
            >
              <span className="text-sm font-semibold text-foreground truncate">
                {projectTitle || "New Project"}
              </span>
              <PencilLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary shrink-0">
            {stageLabel}
          </span>
          {savedProjectId && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-600 shrink-0">
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
