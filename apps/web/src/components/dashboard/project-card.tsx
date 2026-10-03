"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, Download, Eye } from "lucide-react";
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
import type { Project } from "@/types";
import {
  agentRoles,
  formatRole,
  isWorkspaceSpec,
  projectSummaryBadge,
} from "@/lib/project-artifacts";

interface ProjectCardProps {
  readonly project: Project;
  readonly onDelete: (id: number) => void;
  readonly onDownloadPdf: (project: Project) => void;
}

export default function ProjectCard({ project, onDelete, onDownloadPdf }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleView = () => {
    router.push(`/dashboard/${project.id}` as const);
  };

  const handleDelete = () => {
    onDelete(project.id);
    setIsDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Counting every key here labelled workspace metadata as agents - a spec with
  // {type, direction_id, brief, sections} reported "4 Agents". Count only real
  // agent outputs, and say something true when there are none.
  const roles = agentRoles(project.artifacts);
  const summaryBadge = projectSummaryBadge(project.artifacts);
  const sourceLabel = isWorkspaceSpec(project.artifacts) ? "Workspace" : "Pipeline";

  return (
    <>
      {/* `stamp-hover` replaces shadow-[8px_8px_0px_0px_rgba(var(--primary),0.1)],
          which never drew anything: --primary holds a colour, not the three
          channels rgba() expects. h-full keeps a short card level with a tall
          one so the action bars line up across the grid. */}
      <div className="stamp-hover group relative flex h-full flex-col border border-primary/25 bg-card/60 backdrop-blur-sm hover:border-primary/50">
        <div className="label-xs absolute -top-px left-4 z-10 border border-primary/25 border-t-0 bg-background px-2 py-0.5 text-primary/80">
          Ref ID-{project.id.toString().padStart(4, '0')}
        </div>

        <div className="flex-1 p-6 pt-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight">
              {project.title}
            </h3>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="label-xs border border-primary/25 bg-primary/10 px-2 py-1 text-primary">
                {summaryBadge}
              </span>
              <span className="label-xs text-muted-foreground">{sourceLabel}</span>
            </div>
          </div>

          <div className="space-y-4">
            {project.description && (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            )}

            <div className="label-xs flex items-center text-muted-foreground">
              <Calendar className="mr-1.5 h-3 w-3 text-primary/50" />
              {formatDate(project.created_at)}
            </div>

            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-primary/15 pt-3">
                {roles.slice(0, 3).map((agentRole) => (
                  <span
                    key={agentRole}
                    className="label-xs bg-primary/5 px-1.5 py-1 text-primary/80"
                  >
                    {formatRole(agentRole)}
                  </span>
                ))}
                {roles.length > 3 && (
                  <span className="label-xs px-1.5 py-1 text-muted-foreground">
                    +{roles.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto flex border-t border-primary/25">
          <button
            onClick={handleView}
            className="label-xs flex flex-1 items-center justify-center gap-2 border-r border-primary/25 py-3.5 transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          <button
            onClick={() => onDownloadPdf(project)}
            className="flex items-center justify-center border-r border-primary/25 p-3 transition-colors hover:bg-primary/10 hover:text-primary"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center justify-center p-3 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{project.title}&quot; and everything saved with it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
