"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, SkipForward, Copy, Check, Loader2, RotateCcw } from "lucide-react";
import ProtectedRoute from "@/components/protected-route";
import IdeationWizard from "@/components/generator/ideation-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useDraftStore, useIdeationDraftWithDefaults } from "@/lib/draft-store";
import { useGenerateExamples, type ExampleItem } from "@/hooks/useGenerateExamples";
import type { PreGenerationRequest } from "@/types";

/**
 * Ideation Page - Brainstorming interface that connects to NVIDIA NIM
 * 
 * This page allows users to:
 * 1. Fill out a pre-generation form with project idea details
 * 2. Generate AI-powered example descriptions via NVIDIA NIM
 * 3. Select an example and proceed to the generation page
 * 4. Skip directly to generation if they prefer
 */
export default function IdeationPage() {
  const router = useRouter();
  const ideationDraft = useIdeationDraftWithDefaults();
  const {
    updateIdeationPreGen,
    setIdeationExamples,
    selectIdeationExample,
    clearIdeationDraft,
    startGeneration,
  } = useDraftStore();

  // Local form state (synced to draft store)
  const [formData, setFormData] = useState<PreGenerationRequest>({
    ...ideationDraft.preGenRequest,
    title: ideationDraft.preGenRequest.title || "",
    audience: ideationDraft.preGenRequest.audience || "",
    problemStatement: ideationDraft.preGenRequest.problemStatement || "",
  });
  
  // Example generation hook
  const gen = useGenerateExamples();
  
  // Track copied example
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Sync local state changes back to draft store
  useEffect(() => {
    updateIdeationPreGen(formData);
  }, [formData, updateIdeationPreGen]);

  // Sync generated examples to draft store
  useEffect(() => {
    if (gen.examples && gen.examples.length > 0) {
      setIdeationExamples(gen.examples.map(ex => buildExampleText(ex)));
    }
  }, [gen.examples, setIdeationExamples]);

  const handleFormChange = (data: PreGenerationRequest) => {
    setFormData(data);
  };

  const handleGenerateExamples = (data: PreGenerationRequest) => {
    gen.reset();
    gen.generate(data, { stream: true });
  };

  const handleSkipToGeneration = () => {
    const description = formData.problemStatement || formData.title || "";
    if (description) {
      // Store description in generation draft for the generate page to pick up
      startGeneration({
        description,
        frontend_framework: null,
        backend_framework: null,
        database: null,
        auth_service: null,
        payment_gateway: null,
        package_manager: null,
        orm: null,
        runtime: null,
        include_docker: false,
        include_cicd: false,
      });
    }
    router.push("/generate");
  };

  const buildExampleText = (ex: ExampleItem): string => {
    const parts: string[] = [];
    if (ex.title) parts.push(ex.title);
    if (ex.one_line) parts.push(ex.one_line);
    if (ex.scope_bullets?.length) parts.push(ex.scope_bullets.map((b) => `- ${b}`).join("\n"));
    if (ex.full_text) parts.push(ex.full_text);
    return parts.join("\n\n");
  };

  const handleSelectExample = (example: ExampleItem) => {
    const text = buildExampleText(example);
    selectIdeationExample(text);
    // Store in generation draft for the generate page to pick up
    startGeneration({
      description: text,
      frontend_framework: null,
      backend_framework: null,
      database: null,
      auth_service: null,
      payment_gateway: null,
      package_manager: null,
      orm: null,
      runtime: null,
      include_docker: false,
      include_cicd: false,
    });
    router.push("/generate");
  };

  const handleCopyExample = async (example: ExampleItem) => {
    const text = buildExampleText(example);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedId(example.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <ProtectedRoute>
      <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/20 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest">
                Ideation Module Active
              </span>
            </div>
            <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">
              Project <span className="text-amber-500">Ideation</span>
            </h1>
            <p className="text-muted-foreground font-sans text-sm max-w-xl">
              Not sure what to build? Start with just describing your problem or vague idea, and we&apos;ll help you refine it.
            </p>
          </div>

          {/* Skip to Generation */}
          <Button
            variant="outline"
            onClick={handleSkipToGeneration}
            className="font-mono text-[10px] uppercase tracking-widest rounded-none h-10 px-6 border-2 border-primary/20 hover:bg-primary/5"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip to Generation
          </Button>
        </div>

        {/* Ideation Wizard */}
        <div className="relative group">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors" />
          <div className="mb-6">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2">
              <span className="text-amber-500">[01]</span> Define Your Concept
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Follow the steps below to brainstorm and refine your project idea.
            </p>
          </div>

          <div className="bg-background border-2 border-amber-500/20 p-6 rounded-none relative">
            <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-amber-500/30 select-none">
              NVIDIA_NIM_ENDPOINT
            </div>
            <IdeationWizard
              value={formData}
              onChange={handleFormChange}
              onSubmit={handleGenerateExamples}
              isLoading={gen.isLoading}
            />
          </div>
        </div>

        {/* Generated Examples */}
        <div className="relative group">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-amber-500/20 group-hover:bg-amber-500/40 transition-colors" />
          <div className="mb-6">
            <h2 className="text-xl font-mono font-bold uppercase flex items-center gap-2">
              <span className="text-amber-500">[02]</span> AI-Generated Concepts
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Select a concept to use as your project description, or copy and modify.
            </p>
          </div>

          <div className="space-y-6">
            {/* Loading State */}
            {gen.isLoading && (
              <div className="border-2 border-dashed border-amber-500/30 p-12 flex flex-col items-center justify-center gap-4 bg-amber-500/5">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <div className="text-center">
                  <p className="font-mono text-xs uppercase text-amber-500 tracking-widest">
                    Generating Concepts via NVIDIA NIM...
                  </p>
                  {gen.streamText && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-2 max-w-md">
                      {gen.streamText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error State */}
            {gen.error && (
              <div className="border-2 border-destructive/30 p-8 bg-destructive/5">
                <p className="font-mono text-xs uppercase text-destructive">
                  [GENERATION_ERROR]: {gen.error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => gen.reset()}
                  className="mt-4 rounded-none font-mono text-[10px] uppercase"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!gen.isLoading && !gen.error && (!gen.examples || gen.examples.length === 0) && (
              <div className="border-2 border-dashed border-primary/20 p-12 text-center">
                <Sparkles className="h-12 w-12 text-amber-500/30 mx-auto mb-4" />
                <p className="font-mono text-xs uppercase text-muted-foreground tracking-widest">
                  Fill out the form above and click "Initialize_Concepts" to generate ideas.
                </p>
              </div>
            )}

            {/* Examples Grid */}
            {!gen.isLoading && gen.examples && gen.examples.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gen.examples.map((example, idx) => (
                  <Card 
                    key={example.id ?? `example-${idx}`} 
                    className="rounded-none bg-background/40 border-2 border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col group relative overflow-hidden"
                  >
                    {/* Entity Badge */}
                    <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-mono uppercase font-bold text-amber-500">
                        CONCEPT_0{idx + 1}
                      </span>
                    </div>
                    
                    <CardHeader className="border-b border-amber-500/10 bg-amber-500/[0.02]">
                      <CardTitle className="font-mono uppercase tracking-tight text-lg line-clamp-1">
                        {example.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-mono uppercase tracking-tighter text-amber-500/60 line-clamp-1">
                        {example.one_line}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 space-y-4 p-6 font-sans">
                      {/* Scope Bullets */}
                      <ul className="text-xs space-y-2 text-muted-foreground">
                        {(example.scope_bullets ?? []).slice(0, 4).map((bullet, bidx) => (
                          <li key={`${example.id}-bullet-${bidx}`} className="flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">»</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Full Text Preview */}
                      {example.full_text && (
                        <div className="text-[11px] font-mono leading-relaxed text-muted-foreground/80 border border-amber-500/10 p-4 bg-amber-500/[0.02] max-h-24 overflow-hidden">
                          {example.full_text.slice(0, 200)}...
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0 border-t border-amber-500/10 bg-amber-500/[0.01] flex justify-between items-center gap-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSelectExample(example)}
                          className="rounded-none font-mono uppercase text-[10px] tracking-widest px-4 h-8 bg-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-500/30"
                        >
                          Use This
                          <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyExample(example)}
                          className="rounded-none font-mono uppercase text-[10px] tracking-widest px-4 h-8"
                        >
                          {copiedId === example.id ? (
                            <>
                              <Check className="h-3 w-3 mr-2 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex gap-1 overflow-hidden">
                        {(example.tags ?? []).slice(0, 2).map((tag) => (
                          <span 
                            key={tag} 
                            className="text-[8px] font-mono uppercase bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20 text-amber-600/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Regenerate Button (when examples exist) */}
            {!gen.isLoading && gen.examples && gen.examples.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    gen.reset();
                    gen.generate(formData, { stream: true });
                  }}
                  className="font-mono text-[10px] uppercase tracking-widest rounded-none border-2 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate Concepts
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-primary/10">
          <Link 
            href="/"
            className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
          >
            ← Back to Home
          </Link>
          
          <Link 
            href="/generate"
            className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            Go to Generation
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
