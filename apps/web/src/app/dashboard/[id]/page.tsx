"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Trash2, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { api, downloadProjectPdf } from "@/lib/api";
import { toast } from "sonner";
import type { Project } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProject();
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
      await downloadProjectPdf(project.description || project.title, project.artifacts);
      
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
            <span className="font-mono text-[10px] uppercase animate-pulse">Accessing_Data_Node...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-8 gap-4">
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="font-mono text-[10px] uppercase tracking-widest pl-0 hover:bg-transparent hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              Return_to_Archive
            </Button>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Entity_Type: Project_Spec</span>
                <div className="h-px w-8 bg-primary/20" />
                <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">ID: {project.id.toString().padStart(4, '0')}</span>
              </div>
              <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter line-clamp-2 leading-tight">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-sm text-muted-foreground font-sans italic max-w-2xl">"{project.description}"</p>
              )}
              <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase pt-2">
                <div className="flex items-center">
                  <Calendar className="mr-1.5 h-3 w-3 text-primary/40" />
                  Timestamp: {formatDate(project.created_at)}
                </div>
                <div className="bg-primary/5 border border-primary/10 px-2 py-0.5 text-primary/70">
                  {Object.keys(project.artifacts).length} Agents_Engaged
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="font-mono uppercase text-[10px] tracking-widest rounded-none border-2 border-primary/20 bg-background/50 hover:bg-primary/5"
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Download className="mr-2 h-3 w-3" />
              )}
              Export_Artifact
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="font-mono uppercase text-[10px] tracking-widest rounded-none border-2 border-destructive/20 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Purge_Memory
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1">
          <ResultsDisplay
            results={{
              markdown_outputs: project.artifacts,
              judge_results: {},
            }}
            onSave={undefined}
            onDownloadPdf={handleDownloadPdf}
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
            <AlertDialogTitle className="font-mono uppercase tracking-tight">Confirm_Memory_Purge?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-sans italic">
              Accessing destructive protocols for &quot;{project.title}&quot;. This action will terminate all associated data blocks. This is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-none font-mono uppercase text-[10px] tracking-widest">Abort</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-none font-mono uppercase text-[10px] tracking-widest bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Terminating...
                </>
              ) : (
                "Execute_Purge"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
