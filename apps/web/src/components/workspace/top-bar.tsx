"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { ExportDropdown } from "./export-dropdown";
import { Button } from "@/components/ui/button";
import { Save, Loader2, PencilLine, Check, X, FilePlus2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { buildBrief } from "@/lib/workspace-generate";
import { toast } from "sonner";

const GENERIC_HEADINGS = new Set([
  "overview", "project overview", "system overview", "product overview",
  "introduction", "project introduction", "system introduction",
  "background", "project background", "scope", "project scope",
  "description", "project description", "summary", "executive summary",
  "purpose", "goals", "objectives", "problem statement", "vision",
]);

const IDEA_LEADING_WORDS = /^(i\s+want\s+to\s+)?(create|build|make|develop|design|implement)\s+(a|an|the)\s+/i;

const PHASE_LABELS: Record<string, string> = {
  idea_input: "Draft",
  clarifying_questions: "Discovery",
  direction_selection: "Direction",
  generating: "Generating",
  refinement: "Ready",
};

function extractNameFromIdea(idea: string): string {
  const cleaned = idea.replace(IDEA_LEADING_WORDS, "").trim();
  if (!cleaned) return idea;
  const words = cleaned.split(/\s+/);
  if (words.length <= 4) return cleaned;
  return words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");
}

function autoGenerateTitle(
  ideaInput: string,
  sections: { title: string; content: string }[],
): string {
  if (sections.length > 0) {
    const firstSection = sections[0].content.slice(0, 200);
    const titleMatch = firstSection.match(/^#\s+(.+)/m);
    if (titleMatch) {
      const heading = titleMatch[1].trim().toLowerCase();
      if (!GENERIC_HEADINGS.has(heading)) {
        return titleMatch[1].trim();
      }
    }
    const nameMatch = firstSection.match(/(?:project|app|system|platform|tool|service)\s+(?:called|named)?\s*[‘"']?([A-Z][A-Za-z0-9\s]{2,40})/i);
    if (nameMatch) return nameMatch[1].trim();
  }
  return extractNameFromIdea(ideaInput);
}

export function TopBar() {
  const router = useRouter();
  const { phase, projectTitle, ideaInput, documentSections, selectedDirectionId, setProjectTitle, setSavedProjectId, savedProjectId, reset } = useWorkspace();
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);

  // Once a document exists there was no way back to a blank workspace, and
  // nothing said one was possible - the only route was reloading the page.
  const canStartNew = phase === "generating" || phase === "refinement";
  // Optional-chained: this runs on every render, unlike the effects below
  // which are phase-guarded, and the store may not be fully populated yet.
  const hasUnsavedWork = (documentSections?.length ?? 0) > 0 && !savedProjectId;

  const startNewProject = () => {
    reset();
    setConfirmNewOpen(false);
    toast.success("Started a new project");
  };
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

  useEffect(() => {
    if (!projectTitle && phase === "refinement" && ideaInput.trim()) {
      api.generateTitle(ideaInput).then((res) => {
        if (res?.title && res.title !== "Untitled Project") {
          setProjectTitle(res.title);
        }
      }).catch(() => {});
    }
  }, [phase, ideaInput, projectTitle, setProjectTitle]);

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
      // The review travels with the spec. Judge verdicts and contradictions
      // were computed during the run and dropped at save, so a saved spec lost
      // every trace of the scrutiny it had been through.
      const { reviews, contradictions, design } = useWorkspaceStore.getState();
      const judgeResults: Record<string, unknown> = {};
      for (const review of Object.values(reviews)) {
        if (!review.judge) continue;
        // Keyed by role, matching `GenerateResponse.judge_results`, which is
        // what the dashboard's results display already reads.
        judgeResults[review.role] = {
          is_approved: review.judge.approved,
          score: review.judge.score,
          issues_count: review.judge.issuesCount,
          recommended_action: review.judge.recommendedAction,
          feedback: review.judge.feedback,
        };
      }

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
        judge_results: judgeResults,
        contradictions: contradictions as unknown as Array<Record<string, unknown>>,
        // A design goes with its status, its plan and what it still failed -
        // without them a saved design reads like a checked one - and with the
        // brief it was written from, which its plan is checked against.
        ...(design ? { design, brief: buildBrief() } : {}),
      });
      setSavedProjectId(saved.id);
      setProjectTitle(saved.title);
      toast.success("Saved", { description: `"${saved.title}" saved to your projects.` });
      router.push("/dashboard");
    } catch {
      toast.error("Save failed", { description: "Could not save the specification. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-background/90 backdrop-blur-sm">
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
                className="h-7 rounded-sm border border-input bg-surface-sunken/60 px-2 text-sm font-bold text-foreground w-56 focus:outline-none focus:ring-1 focus:ring-ring"
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
              <span className="text-sm font-bold text-foreground truncate">
                {projectTitle || "New Project"}
              </span>
              <PencilLine className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          )}
          {/* Status readouts, so they take the mono voice. The saved chip was
              emerald; teal is the palette's colour for a passing state. */}
          <span className="label-xs hidden sm:inline-flex shrink-0 items-center border border-primary/30 bg-primary/10 px-2 py-1 text-primary">
            {stageLabel}
          </span>
          {savedProjectId && (
            <span className="label-xs hidden sm:inline-flex shrink-0 items-center gap-1.5 border border-tertiary/40 bg-tertiary/10 px-2 py-1 text-tertiary">
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
          {canStartNew && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => (hasUnsavedWork ? setConfirmNewOpen(true) : startNewProject())}
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New project</span>
            </Button>
          )}
          <ExportDropdown />
        </div>
      </div>

      <AlertDialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new project?</AlertDialogTitle>
            <AlertDialogDescription>
              This document has not been saved. Starting a new project clears it from
              the workspace and it will not appear in your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={startNewProject}>
              Discard and start new
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
