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
        description: "Project specifications generated successfully.",
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to generate project",
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
        description: "Your project has been saved to the dashboard.",
      });
      
      setIsSaveModalOpen(false);
      
      // Optionally redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to save project",
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
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Project Generator</h1>
          <p className="text-muted-foreground">
            Describe your project idea and let our AI agents generate comprehensive specifications
          </p>
        </div>

        {/* PRE-GENERATION FORM SECTION - Completely separate */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">Pre-Generation: Quick Example Generator</h2>
            <p className="text-muted-foreground">
              Fill minimal fields to generate example project descriptions. Select one to quickly populate your main form.
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <PreGenerationForm
              value={preGenDraft}
              onChange={setPreGenDraft}
              onSubmit={handlePreGenSubmit}
              isLoading={isGenerating}
            />
          </div>
        </div>

        {/* MAIN PROJECT FORM SECTION - Completely separate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <ProjectForm 
                onSubmit={handleGenerate} 
                isLoading={isGenerating}
                initialDescription={projectDescription}
              />
            </div>
          </div>

          {/* Right Panel - Results */}
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

