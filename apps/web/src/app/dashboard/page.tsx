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
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">
              View and manage your saved project specifications
            </p>
          </div>
          
          <Link href="/generator">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Usage Statistics */}
        <div className="mb-8">
          <UsageStats stats={metrics} isLoading={isLoadingMetrics} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Start by creating your first project specification using our AI-powered multi-agent system."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </ProtectedRoute>
  );
}

