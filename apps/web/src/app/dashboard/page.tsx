"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/protected-route";
import ArchitectureList from "@/components/dashboard/architecture-list";
import ProjectCard from "@/components/dashboard/project-card";
import EmptyState from "@/components/dashboard/empty-state";
import UsageStats from "@/components/dashboard/usage-stats";
import { Badge } from "@/components/ui/badge";
import { api, downloadProjectPdf } from "@/lib/api";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { toast } from "sonner";
import type { Project, UsageStatsResponse } from "@/types";
import { exportOutputs } from "@/lib/project-artifacts";

interface CacheHealth {
  status: string;
  keys_tracked: number;
  ttl_seconds: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<UsageStatsResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [cacheHealth, setCacheHealth] = useState<CacheHealth | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [lsPrefs, setLsPrefs] = useState<{ enableTracing: boolean; langsmithProject: string } | null>(null);

  const handleNewProject = useCallback(() => {
    useWorkspaceStore.getState().reset();
    router.push("/workspace");
  }, [router]);

  useEffect(() => {
    loadProjects();
    loadMetrics();
    loadCacheHealth();
    loadLangSmithStatus();
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
      const data = await api.getUsageStats();
      setMetrics(data);
    } catch (error) {
      // Silently fail metrics loading - it's not critical
      console.error("Failed to load metrics:", error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const loadLangSmithStatus = async () => {
    try {
      const res = await api.getPreferences();
      const p = res.preferences ?? {};
      setLsPrefs({
        enableTracing: p.enableTracing !== false,
        langsmithProject: (p.langsmithProject as string) || "",
      });
    } catch {
      setLsPrefs(null);
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

  const loadCacheHealth = async () => {
    setIsLoadingCache(true);
    try {
      const data = await api.getCacheHealth();
      setCacheHealth(data);
    } catch {
      setCacheHealth(null);
    } finally {
      setIsLoadingCache(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const result = await api.invalidateUserCache();
      toast.success("Cache Cleared", {
        description: `Cleared ${result.keys_cleared} cached entries.`,
      });
      await loadCacheHealth();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to clear cache",
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleDownloadPdf = async (project: Project) => {
    try {
      await downloadProjectPdf(project.description || project.title, exportOutputs(project.artifacts));
      
      toast.success("PDF Downloaded!", {
        description: "The project has been downloaded.",
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
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/25 pb-8 gap-4">
          <div className="space-y-2">
            <span className="label-xs text-primary">Dashboard</span>
            <h1 className="text-4xl font-bold tracking-[-0.03em]">Your projects</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Every design spec you have saved, and every architecture you have compared.
            </p>
          </div>

          <Button size="xl" onClick={handleNewProject} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Button>
        </div>

        <UsageStats stats={metrics} isLoading={isLoadingMetrics} />

        {/* LangSmith Status */}
        {lsPrefs && (
          <div className="p-4 bg-primary/5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-primary/60" />
                <div>
                  <span className="label-xs text-primary">LangSmith tracing</span>
                  {lsPrefs.langsmithProject && (
                    <p className="label-xs text-muted-foreground mt-1.5">
                      {lsPrefs.langsmithProject}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={lsPrefs.enableTracing ? "tertiary" : "outline"}>
                {lsPrefs.enableTracing ? "Active" : "Disabled"}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-primary/25 pb-3">
            <span className="label-xs text-primary">Saved projects</span>
            <div className="h-px flex-1 bg-primary/15" />
            <span className="label-xs text-muted-foreground">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="label-xs text-muted-foreground">Loading projects</span>
            </div>
          ) : (
            <>
              {projects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="Saved design specs land here. Start a draft in the Workshop to write your first."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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

        <ArchitectureList />

        {/* Cache Management */}
        <div>
          <div className="flex items-center gap-4 border-b border-primary/25 pb-3">
            <span className="label-xs text-primary">Cache</span>
            <div className="h-px flex-1 bg-primary/15" />
            <span className="label-xs text-muted-foreground">
              {cacheHealth ? `TTL ${cacheHealth.ttl_seconds}s` : "Status unknown"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-x border-b border-primary/15 bg-muted/20 p-6">
            <p className="text-sm text-muted-foreground">
              {cacheHealth
                ? `${cacheHealth.keys_tracked} keys tracked. Clearing forces the next run to recompute from scratch.`
                : "Could not read cache status from the API."}
            </p>
            <Button
              onClick={handleClearCache}
              disabled={isClearingCache || isLoadingCache}
              variant="outline"
              size="sm"
              className="label-xs shrink-0"
            >
              {isClearingCache ? (
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-2" />
              )}
              {isClearingCache ? "Clearing" : "Clear cache"}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

