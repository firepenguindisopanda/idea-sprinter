"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  Download, 
  Save, 
  Loader2, 
  ArrowLeft, 
  Home,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import ProtectedRoute from "@/components/protected-route";
import ResultsDisplay from "@/components/generator/results-display";
import SaveModal from "@/components/generator/save-modal";
import { Button } from "@/components/ui/button";
import { useDraftStore } from "@/lib/draft-store";
import { api, downloadProjectPdf } from "@/lib/api";
import { toast } from "sonner";
import type { GenerateResponse } from "@/types";

/**
 * Results Page - Display generated specifications with session persistence
 * 
 * This page:
 * 1. Loads results from draft store using sessionId
 * 2. Provides tabbed document viewer (from ResultsDisplay component)
 * 3. Allows saving to dashboard and exporting as PDF
 * 4. Shows overall generation summary and quality scores
 */
export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  // Draft store
  const { generationDraft, clearGenerationDraft } = useDraftStore();
  
  // Local state
  const [results, setResults] = useState<GenerateResponse | null>(null);
  const [projectDescription, setProjectDescription] = useState("");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load results from draft store
  useEffect(() => {
    if (generationDraft && generationDraft.sessionId === sessionId) {
      if (generationDraft.partialResults) {
        setResults(generationDraft.partialResults);
        setProjectDescription(generationDraft.projectRequest.description);
      } else if (!generationDraft.isComplete) {
        // Generation not complete, redirect back to generate page
        router.push('/generate');
      } else {
        setNotFound(true);
      }
    } else {
      // Session not found in draft store
      setNotFound(true);
    }
  }, [generationDraft, sessionId, router]);

  const handleSave = async (title: string, description: string) => {
    if (!results) return;
    
    setIsSaving(true);
    
    try {
      await api.saveProject({
        title,
        description: description || null,
        artifacts: results.markdown_outputs,
      });
      
      toast.success("Project Saved!", {
        description: "TRANSACTION_COMPLETE: Data committed to local archive.",
      });
      
      setIsSaveModalOpen(false);
      
      // Clear draft and redirect to dashboard
      clearGenerationDraft();
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "UPLOAD_FAILURE: Could not commit data.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!results) return;
    
    setIsDownloading(true);
    
    try {
      await downloadProjectPdf(projectDescription, results.markdown_outputs);
      
      toast.success("PDF Downloaded!", {
        description: "FILE_EXPORT_SUCCESS: Artifact downloaded to local drive.",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "EXPORT_FAULT: PDF generation failed.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleArtifactUpdate = async (agentKey: string, newContent: string) => {
    if (!results) return;
    
    // Update local state
    setResults({
      ...results,
      markdown_outputs: {
        ...results.markdown_outputs,
        [agentKey]: newContent,
      },
    });
    
    toast.success("Content Updated", {
      description: "Changes saved locally. Remember to save to dashboard.",
    });
  };

  const handleNewGeneration = () => {
    clearGenerationDraft();
    router.push('/generate');
  };

  // Calculate summary stats
  const getQualitySummary = () => {
    if (!results?.judge_results) return null;
    
    const scores = Object.values(results.judge_results).map(j => j.score);
    const avgScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : 'N/A';
    
    const approved = Object.values(results.judge_results).filter(j => j.is_approved).length;
    const total = Object.values(results.judge_results).length;
    
    return { avgScore, approved, total };
  };

  const qualitySummary = getQualitySummary();

  // Not found state
  if (notFound) {
    return (
      <ProtectedRoute>
        <div className="w-full max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="border-2 border-dashed border-primary/20 p-12 space-y-6">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-mono font-bold uppercase">Session Not Found</h1>
              <p className="text-muted-foreground text-sm font-mono">
                The generation session "{sessionId}" could not be found or has expired.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.push('/generate')}
                className="rounded-none font-mono uppercase text-[10px] tracking-widest"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Generation
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="rounded-none font-mono uppercase text-[10px] tracking-widest"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Loading state
  if (!results) {
    return (
      <ProtectedRoute>
        <div className="w-full max-w-4xl mx-auto px-6 py-16 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            Loading Results...
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full max-w-[96vw] mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[10px] font-mono text-green-500 uppercase tracking-widest">
                Generation Complete
              </span>
            </div>
            <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">
              Generated <span className="text-primary">Specifications</span>
            </h1>
            <p className="text-muted-foreground font-sans text-sm max-w-xl">
              Review, edit, and export your comprehensive software specification documents.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleNewGeneration}
              className="rounded-none font-mono uppercase text-[10px] tracking-widest h-10 px-4 border-2 border-primary/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Generation
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="rounded-none font-mono uppercase text-[10px] tracking-widest h-10 px-4 border-2 border-primary/20"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button
              onClick={() => setIsSaveModalOpen(true)}
              disabled={isSaving}
              className="rounded-none font-mono uppercase text-[10px] tracking-widest h-10 px-4"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save to Dashboard
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {qualitySummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-primary/20 p-4 bg-background/50">
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Documents Generated
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {Object.keys(results.markdown_outputs).length}
              </div>
            </div>
            <div className="border border-primary/20 p-4 bg-background/50">
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Average Quality Score
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {qualitySummary.avgScore}/10
              </div>
            </div>
            <div className="border border-primary/20 p-4 bg-background/50">
              <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Approved by Judge
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {qualitySummary.approved}/{qualitySummary.total}
              </div>
            </div>
          </div>
        )}

        {/* Project Description Preview */}
        {projectDescription && (
          <div className="border border-primary/10 p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary/60" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                Project Description
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {projectDescription}
            </p>
          </div>
        )}

        {/* Results Display */}
        <div className="min-h-[600px]">
          <ResultsDisplay
            results={results}
            onSave={() => setIsSaveModalOpen(true)}
            onArtifactUpdate={handleArtifactUpdate}
            onDownloadPdf={handleDownloadPdf}
            isSaving={isSaving}
            isDownloading={isDownloading}
            hideActions={true}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-primary/10">
          <Link 
            href="/generate"
            className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Generator
          </Link>
          
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
          >
            <Home className="h-3 w-3" />
            Go to Dashboard
          </Link>
        </div>
      </div>

      {/* Save Modal */}
      <SaveModal
        open={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </ProtectedRoute>
  );
}
