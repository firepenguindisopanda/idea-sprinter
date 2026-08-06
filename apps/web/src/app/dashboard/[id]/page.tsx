"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Compass, Download, Trash2, Loader2, Calendar, Package } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import ProtectedRoute from "@/components/protected-route";
import ResultsDisplay from "@/components/generator/results-display";
import DownloadModal from "@/components/generator/download-modal";
import { api, downloadProjectPdf } from "@/lib/api";
import { toast } from "sonner";
import type { Project } from "@/types";
import {
  displayLabels,
  displayOutputs,
  exportOutputs,
  formatRole,
  projectReview,
  projectSummaryBadge,
  supportsInlineEditing,
} from "@/lib/project-artifacts";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to load project",
      });
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!project) return;

    setIsDownloading(true);
    try {
      await downloadProjectPdf(project.description || project.title, exportOutputs(project.artifacts));
      
      toast.success("PDF Downloaded!", {
        description: "Your project specification has been downloaded.",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to download PDF",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      await api.deleteProject(project.id);
      
      toast.success("Project Deleted", {
        description: "The project has been permanently deleted.",
      });

      router.push("/dashboard");
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete project",
      });
      setIsDeleting(false);
    }
  };

  const handleArtifactUpdate = async (agentKey: string, newContent: string) => {
    if (!project) return;

    try {
      // Create a deep copy of artifacts
      const updatedArtifacts = { ...project.artifacts, [agentKey]: newContent };
      
      // Optimistic update
      setProject({ ...project, artifacts: updatedArtifacts });

      // API Call
      await api.updateProject(project.id, {
        title: project.title, // Backend might require title? Schema says it's optional in ProjectUpdate but good to check. 
                              // Actually schemas.py says ProjectCreate(ProjectBase) and ProjectBase requires title/artifacts.
                              // Wait, checking schemas.py again.
        artifacts: updatedArtifacts
      });

      toast.success("Artifact Updated", {
        description: "Changes have been committed to the project memory.",
      });
    } catch (error) {
      // Revert on error
      loadProject(); // Reload from server to be safe
      toast.error("Update Failed", {
        description: error instanceof Error ? error.message : "Failed to update artifact",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="label-xs animate-pulse">Loading project...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return null;
  }

  // Was `Object.keys(project.artifacts).length` labelled "Sections", which
  // counted workspace metadata keys for workspace specs.
  const sectionCountLabel = projectSummaryBadge(project.artifacts);
  const labels = displayLabels(project.artifacts);
  const canEdit = supportsInlineEditing(project.artifacts);
  const review = projectReview(project.artifacts);

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-8 gap-4">
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="label-xs pl-0 hover:bg-transparent hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              Back to Dashboard
            </Button>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="label-xs text-primary/80">Project Specification</span>
                <div className="h-px w-8 bg-primary/20" />
                <span className="label-xs text-primary/80">ID: {project.id.toString().padStart(4, '0')}</span>
              </div>
              <h1 className="text-4xl font-bold tracking-[-0.03em] line-clamp-2 leading-tight">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground font-sans max-w-2xl">&quot;{project.description}&quot;</p>
              )}
              <div className="label-xs flex items-center gap-4 text-muted-foreground pt-2">
                <div className="flex items-center">
                  <Calendar className="mr-1.5 h-3 w-3 text-primary/40" />
                  Timestamp: {formatDate(project.created_at)}
                </div>
                <div className="bg-primary/5 px-2 py-0.5 text-primary/80">
                  {sectionCountLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {/* `/architecture` had no route in from a spec - sessions were
                URL-param-only and the requirements had to be retyped. */}
            <Button
              asChild
              variant="plate"
              className="label-xs"
            >
              <Link href={`/architecture?project_id=${project.id}`}>
                <Compass className="mr-2 h-3 w-3" />
                Design Architecture
              </Link>
            </Button>
            <Button
              variant="plateActive"
              onClick={() => setIsDownloadModalOpen(true)}
              className="label-xs"
            >
              <Package className="mr-2 h-3 w-3" />
              Download Specs
            </Button>
            <Button
              variant="plate"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="label-xs"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Download className="mr-2 h-3 w-3" />
              )}
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="label-xs rounded-none border-2 border-destructive/20 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete Project
            </Button>
          </div>
        </div>

        {review.contradictions.length > 0 && (
          <div className="mb-6 border-2 border-warning/30 bg-warning/5 p-4">
            <div className="label-xs flex items-center gap-2 text-warning dark:text-warning mb-3">
              <AlertTriangle className="h-3 w-3" />
              {review.contradictions.length} cross-agent{" "}
              {review.contradictions.length === 1 ? "contradiction" : "contradictions"}
            </div>
            <ul className="space-y-2 text-sm">
              {review.contradictions.map((c, i) => (
                <li key={i}>
                  <span className="label-xs text-muted-foreground mr-2">
                    {c.severity}
                    {c.roles && c.roles.length > 0 && ` · ${c.roles.map(formatRole).join(", ")}`}
                  </span>
                  <span className="text-muted-foreground">{c.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1">
          <ResultsDisplay
            results={{
              markdown_outputs: displayOutputs(project.artifacts),
              // Saved specs now carry their judge verdicts under `_review`;
              // this was hardcoded empty, so a reviewed spec looked unreviewed.
              judge_results: review.judgeResults,
            }}
            onSave={undefined}
            onDownloadPdf={handleDownloadPdf}
            onArtifactUpdate={canEdit ? handleArtifactUpdate : undefined}
            outputLabels={labels}
            isSaving={false}
            isDownloading={isDownloading}
            hideActions
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none border-2 border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="label-lg">Delete this project?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-sans ">
              This will permanently delete &quot;{project.title}&quot; and all its generated specifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="label-xs rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(buttonVariants({ variant: "destructive" }), "label-xs rounded-none")}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Modal for Markdown Specs */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        results={{
          markdown_outputs: displayOutputs(project.artifacts),
          judge_results: review.judgeResults,
          project_description: project.description || "",
        }}
        projectName={project.title}
      />
    </ProtectedRoute>
  );
}
