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

  const agentCount = Object.keys(project.artifacts).length;

  return (
    <>
      <div className="group relative border-2 border-primary/20 bg-background/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-[8px_8px_0px_0px_rgba(var(--primary),0.1)]">
        <div className="absolute -top-3 left-4 bg-background border border-primary/20 px-2 py-0.5 text-[8px] font-mono text-primary/60 uppercase tracking-widest z-10">
          Ref: ID-{project.id.toString().padStart(4, '0')}
        </div>
        
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="font-mono font-bold text-xl uppercase tracking-tighter line-clamp-2 leading-tight">
              {project.title}
            </h3>
            <div className="font-mono text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 shrink-0 uppercase">
              {agentCount} Agents
            </div>
          </div>
          
          <div className="space-y-4">
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 font-sans italic leading-relaxed">
                "{project.description}"
              </p>
            )}
            
            <div className="flex items-center text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              <Calendar className="mr-1.5 h-3 w-3 text-primary/50" />
              T-Minus: {formatDate(project.created_at)}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
              {Object.keys(project.artifacts).slice(0, 3).map((agentRole) => (
                <span key={agentRole} className="text-[9px] font-mono text-primary/70 uppercase border border-primary/10 px-1.5 py-0.5 bg-primary/5">
                  {agentRole.replaceAll('_', ' ')}
                </span>
              ))}
              {Object.keys(project.artifacts).length > 3 && (
                <span className="text-[9px] font-mono text-muted-foreground uppercase px-1.5 py-0.5">
                  +{Object.keys(project.artifacts).length - 3} OTHERS
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex border-t-2 border-primary/20">
          <button
            onClick={handleView}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase tracking-widest hover:bg-primary/10 transition-colors border-r border-primary/20"
          >
            <Eye className="h-4 w-4" />
            Inspect
          </button>
          <button
            onClick={() => onDownloadPdf(project)}
            className="flex items-center justify-center p-3 hover:bg-primary/10 transition-colors border-r border-primary/20"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center justify-center p-3 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Purge"
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
              This will permanently delete &quot;{project.title}&quot; and all its generated specifications.
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
