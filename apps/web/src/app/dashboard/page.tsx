"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/protected-route";
import ProjectCard from "@/components/dashboard/project-card";
import EmptyState from "@/components/dashboard/empty-state";
import UsageStats from "@/components/dashboard/usage-stats";
import { api, downloadProjectPdf } from "@/lib/api";
import { toast } from "sonner";
import type { Project, UsageMetrics } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    loadProjects();
    loadMetrics();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to load projects",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (error) {
      // Silently fail metrics loading - it's not critical
      console.error("Failed to load metrics:", error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      
      toast.success("Project Deleted", {
        description: "The project has been permanently deleted.",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete project",
      });
    }
  };

  const handleDownloadPdf = async (project: Project) => {
    try {
      await downloadProjectPdf(project.description || project.title, project.artifacts);
      
      toast.success("PDF Downloaded!", {
        description: "Your project specification has been downloaded.",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to download PDF",
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-7xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-8 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Dashboard</span>
            </div>
            <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">Your <span className="text-primary">Projects</span></h1>
            <p className="text-muted-foreground font-sans text-sm max-w-xl">
              View and manage your saved specification documents.
            </p>
          </div>
          
          <Link href={{ pathname: "/workspace" }}>
            <Button size="xl" className="font-mono uppercase tracking-widest rounded-none border-2 border-primary/20 shadow-[4px_4px_0px_0px_rgba(var(--primary),0.1)]">
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Usage Statistics */}
        <div className="relative">
          <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-primary/20 select-none uppercase">Usage</div>
          <UsageStats stats={metrics} isLoading={isLoadingMetrics} />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-xs font-bold uppercase text-primary/70">Saved Projects:</span>
            <div className="h-px flex-1 bg-primary/10" />
            <span className="font-mono text-xs text-muted-foreground">{projects.length} projects</span>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="font-mono text-[10px] uppercase animate-pulse">Loading projects...</span>
            </div>
          ) : (
            <>
              {projects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="You haven&apos;t created any projects yet. Start a new generation to get started."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={handleDelete}
                      onDownloadPdf={handleDownloadPdf}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* The Relics */}
        <div className="relative">
          <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-primary/20 select-none uppercase">Legacy</div>
          <div className="border border-primary/10 bg-muted/20 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-mono font-bold uppercase tracking-tighter text-muted-foreground">
                The Relics
              </h2>
              <p className="text-sm text-muted-foreground/70">
                Older tools, still functional. The Workshop Studio is the recommended experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/ideation"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <span className="text-sm">💡</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Ideation</div>
                  <div className="text-[10px] text-muted-foreground/60">Brainstorm & refine</div>
                </div>
              </Link>

              <Link
                href="/generate"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="text-sm">⚡</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Generator</div>
                  <div className="text-[10px] text-muted-foreground/60">Direct spec generation</div>
                </div>
              </Link>

              <Link
                href="/prd"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <span className="text-sm">📄</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">PRD Agent</div>
                  <div className="text-[10px] text-muted-foreground/60">Product requirements doc</div>
                </div>
              </Link>

              <Link
                href="/architecture"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <span className="text-sm">🏗️</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Architecture</div>
                  <div className="text-[10px] text-muted-foreground/60">Compare architectures</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

