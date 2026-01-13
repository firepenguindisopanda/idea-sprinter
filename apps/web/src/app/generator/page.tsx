"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/protected-route";
import ProjectForm from "@/components/generator/project-form";
import PreGenerationForm from "@/components/generator/pre-generation-form";
import ExamplesModal from "@/components/generator/examples-modal";
import ResultsDisplay from "@/components/generator/results-display";
import SaveModal from "@/components/generator/save-modal";
import { api, downloadProjectPdf } from "@/lib/api";
import { toast } from "sonner";
import type { ProjectRequest, GenerateResponse, PreGenerationRequest } from "@/types";

export default function GeneratorPage() {
  const router = useRouter();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateResponse | null>(null);
  const [projectDescription, setProjectDescription] = useState("");
  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Pre-generation form state
  const [preGenDraft, setPreGenDraft] = useState<PreGenerationRequest>({
    title: "",
    audience: "",
    techStack: "",
    scopeSeeds: [],
    exampleCount: 3,
    constraints: "",
    desiredTone: "",
    timeBudget: "",
    nonGoals: "",
  });
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
  const [preGenRequest, setPreGenRequest] = useState<PreGenerationRequest | null>(null);

  const handleGenerate = async (data: ProjectRequest) => {
    setIsGenerating(true);
    setProjectDescription(data.description);
    
    try {
      const response = await api.generateProject(data);
      setResults(response);
      
      toast.success("Success!", {
        description: "ARCHITECTURAL_DATA_RESOLVED: Project specifications generated.",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "PROCEDURAL_FAULT: Generation failed.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
      
      // Optionally redirect to dashboard
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

  const handlePreGenSubmit = (req: PreGenerationRequest) => {
    setPreGenRequest(req);
    setIsExamplesModalOpen(true);
  };

  const handleExampleSelect = (text: string) => {
    setProjectDescription(text);
  };

  const handleRegenerateExamples = () => {
    const current = preGenRequest;
    if (!current) return;
    setPreGenRequest(null);
    setTimeout(() => setPreGenRequest({ ...current }), 50);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-7xl space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">System Status: Ready</span>
            </div>
            <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">Specification <span className="text-primary">Generator</span></h1>
            <p className="text-muted-foreground font-sans text-sm max-w-xl">
              Input project parameters to initialize the multi-agent architectural swarm.
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">Session Node</div>
            <div className="text-xs font-mono font-bold uppercase">US-EAST-01 // AGENT-V4</div>
          </div>
        </div>

        {/* PRE-GENERATION FORM SECTION */}
        <div className="relative group">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary/30 transition-colors" />
          <div className="mb-6">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2">
              <span className="text-primary">[01]</span> Project Prototyping
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Generate rapid mockups and project sketches to refine your initial concept.
            </p>
          </div>
          
          <div className="bg-background border-2 border-primary/10 p-6 rounded-none relative">
            <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-primary/20 select-none">MODULE_PREGEN_V2</div>
            <PreGenerationForm
              value={preGenDraft}
              onChange={setPreGenDraft}
              onSubmit={handlePreGenSubmit}
              isLoading={isGenerating}
            />
          </div>
        </div>

        {/* MAIN PROJECT FORM SECTION */}
        <div className="relative group">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary/30 transition-colors" />
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2">
              <span className="text-primary">[02]</span> Technical Blueprint Initialization
            </h2>
            <div className="hidden sm:block h-px flex-1 mx-6 bg-primary/10" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-background border-2 border-primary/20 p-8 rounded-none shadow-[4px_4px_0px_0px_rgba(var(--primary),0.1)] relative">
                <div className="absolute -top-3 -left-3 h-6 w-6 border-l-2 border-t-2 border-primary" />
                <div className="absolute -bottom-3 -right-3 h-6 w-6 border-r-2 border-b-2 border-primary" />
                <ProjectForm 
                  onSubmit={handleGenerate} 
                  isLoading={isGenerating}
                  initialDescription={projectDescription}
                />
              </div>
            </div>

            <div className="space-y-6">
              <ResultsDisplay
                results={results}
                onSave={() => setIsSaveModalOpen(true)}
                onDownloadPdf={handleDownloadPdf}
                isSaving={isSaving}
                isDownloading={isDownloading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Examples Modal */}
      <ExamplesModal
        open={isExamplesModalOpen}
        onOpenChange={setIsExamplesModalOpen}
        request={preGenRequest}
        isLoading={false}
        onSelect={handleExampleSelect}
        onRegenerate={handleRegenerateExamples}
      />

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

