"use client";

import { Suspense, useState, useEffect } from "react";
import ProtectedRoute from "@/components/protected-route";
import ArchitectureChat from "@/components/architecture/architecture-chat";
import ArchitectureOptions from "@/components/architecture/architecture-options";
import ArchitectureComparisonView from "@/components/architecture/comparison-matrix";
import ImportPatternModal from "@/components/architecture/import-pattern-modal";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useSSE } from "@/hooks/useSSE";
import type { ArchitectureSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Scale, CheckCircle2, Library } from "lucide-react";
import Link from "next/link";

function ArchitecturePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const [session, setSession] = useState<ArchitectureSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'options' | 'compare'>('chat');
  const [showPatternModal, setShowPatternModal] = useState(false);

  const sse = useSSE<{ type: string }>({
    onEvent: async (event) => {
      if (event.type === 'option' && session) {
        await loadSession(session.id);
      }
    },
    onError: (err) => console.error("Failed to generate:", err),
  });
  const isGenerating = sse.isStreaming;
  
  // Form state for new session
  const [projectName, setProjectName] = useState("");
  const [requirements, setRequirements] = useState("");
  const [constraints, setConstraints] = useState("");
  
  // Load existing session from URL if present
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      const data = await api.getArchitectureSession(id);
      setSession(data);
      if (data.options.length > 0) {
        setActiveView('options');
      }
      if (data.comparison) {
        setActiveView('compare');
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!projectName.trim() || !requirements.trim()) return;
    
    setIsCreating(true);
    try {
      const newSession = await api.createArchitectureSession({
        project_name: projectName,
        requirements: requirements,
        constraints: constraints || undefined,
        persona: user?.persona ?? undefined,
      });
      setSession(newSession);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerate = async () => {
    if (!session) return;
    setActiveView('options');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    await sse.startStream(
      `${apiUrl}/architecture/sessions/${session.id}/generate`,
      { num_options: 3 },
    );
  };

  const handleCompare = async () => {
    if (!session) return;
    
    setIsComparing(true);
    try {
      const comparison = await api.compareArchitectureOptions(session.id);
      setSession(prev => prev ? { ...prev, comparison } : null);
      setActiveView('compare');
    } catch (error) {
      console.error("Failed to compare:", error);
    } finally {
      setIsComparing(false);
    }
  };

  const handleRefined = async () => {
    if (!session) return;
    await loadSession(session.id);
  };

  const handleSelectOption = async (optionId: string) => {
    if (!session) return;
    
    try {
      await api.selectArchitectureOption(session.id, { option_id: optionId });
      setSession(prev => prev ? { ...prev, selected_option_id: optionId } : null);
    } catch (error) {
      console.error("Failed to select option:", error);
    }
  };

  // Show creation form if no session
  if (!session) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">
            Architecture <span className="text-primary">Studio</span>
          </h1>
          <p className="text-muted-foreground">
            Explore different architectural approaches for your project. Generate multiple options, 
            compare them, and refine the best fit for your needs.
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono uppercase text-sm">New Architecture Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-mono uppercase text-primary/60">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My SaaS Application"
                className="w-full p-3 border border-primary/20 bg-background focus:border-primary focus:outline-none font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-mono uppercase text-primary/60">Requirements</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Describe what your application needs to do..."
                rows={6}
                className="w-full p-3 border border-primary/20 bg-background focus:border-primary focus:outline-none font-mono resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-mono uppercase text-primary/60">Constraints (Optional)</label>
              <textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Budget, timeline, tech preferences, etc..."
                rows={3}
                className="w-full p-3 border border-primary/20 bg-background focus:border-primary focus:outline-none font-mono resize-none"
              />
            </div>

            <Button 
              onClick={handleCreateSession}
              disabled={isCreating || !projectName.trim() || !requirements.trim()}
              className="w-full font-mono uppercase tracking-widest"
              size="lg"
            >
              {isCreating ? 'Creating...' : 'Start Architecture Session'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show session interface
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Link>
            </Button>
            <span className="text-xs font-mono text-primary/60 uppercase">Architecture Studio</span>
          </div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-tighter">
            {session.project_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.options.length === 0 
              ? "Define your requirements and generate architecture options" 
              : session.selected_option_id 
                ? "Architecture selected" 
                : "Compare options and select the best fit"}
          </p>
        </div>

        <div className="flex gap-2">
          {session.options.length === 0 && (
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="font-mono uppercase text-[10px]"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Options'}
            </Button>
          )}
          
          {session.options.length > 0 && !session.comparison && (
            <Button 
              onClick={handleCompare}
              disabled={isComparing}
              variant="outline"
              className="font-mono uppercase text-[10px]"
            >
              <Scale className="h-3 w-3 mr-2" />
              {isComparing ? 'Comparing...' : 'Compare Options'}
            </Button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-4 border-b border-primary/10">
        <button
          onClick={() => setActiveView('chat')}
          className={`pb-2 px-1 font-mono text-[10px] uppercase tracking-widest border-b-2 transition-colors ${
            activeView === 'chat' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-primary/40 hover:text-primary'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveView('options')}
          disabled={session.options.length === 0}
          className={`pb-2 px-1 font-mono text-[10px] uppercase tracking-widest border-b-2 transition-colors ${
            activeView === 'options' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-primary/40 hover:text-primary disabled:opacity-50'
          }`}
        >
          Options ({session.options.length})
        </button>
        <button
          onClick={() => setActiveView('compare')}
          disabled={!session.comparison}
          className={`pb-2 px-1 font-mono text-[10px] uppercase tracking-widest border-b-2 transition-colors ${
            activeView === 'compare' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-primary/40 hover:text-primary disabled:opacity-50'
          }`}
        >
          Compare
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeView === 'chat' && (
            <ArchitectureChat 
              session={session} 
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onRefined={handleRefined}
            />
          )}
          
          {activeView === 'options' && session.options.length > 0 && (
            <ArchitectureOptions 
              options={session.options}
              selectedOptionId={session.selected_option_id}
              onSelect={handleSelectOption}
            />
          )}
          
          {activeView === 'compare' && session.comparison && (
            <ArchitectureComparisonView 
              comparison={session.comparison}
              selectedOptionId={session.selected_option_id}
              onSelect={handleSelectOption}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono uppercase text-primary/60">Session Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-mono uppercase text-xs">{session.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Options</span>
                <span className="font-mono uppercase text-xs">{session.options.length}</span>
              </div>
              {session.selected_option_id && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Architecture Selected</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono uppercase text-primary/60">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{session.requirements}</p>
              {session.constraints && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <span className="text-xs font-mono uppercase text-primary/60">Constraints</span>
                  <p className="text-sm text-muted-foreground mt-1">{session.constraints}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono uppercase text-primary/60">Pattern Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Import proven architecture patterns into your session.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPatternModal(true)}
                className="w-full font-mono uppercase text-[10px]"
              >
                <Library className="h-3 w-3 mr-2" />
                Browse Patterns
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {showPatternModal && session && (
        <ImportPatternModal
          sessionId={session.id}
          onClose={() => setShowPatternModal(false)}
          onImported={() => loadSession(session.id)}
        />
      )}
    </div>
  );
}

function ArchitecturePageLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-primary/20 rounded" />
        <div className="h-4 w-96 bg-primary/10 rounded" />
        <div className="h-64 bg-primary/5 rounded border border-primary/10" />
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ArchitecturePageLoading />}>
        <ArchitecturePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
