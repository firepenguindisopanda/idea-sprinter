"use client";

import { Suspense, useState } from "react";
import ProtectedRoute from "@/components/protected-route";
import PrdChat from "@/components/prd/prd-chat";
import PrdStatus from "@/components/prd/prd-status";
import PrdDocument from "@/components/prd/prd-document";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import Link from "next/link";

function PrdPageContent() {
  const params = useSearchParams();
  // Get initial session_id from URL if present
  const urlSessionId = params?.get('session_id');
  const prefill = params?.get('prefill');
  
  // Use state to track session_id - this persists across re-renders
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  // Store the generated PRD content directly from the chat
  const [generatedPrd, setGeneratedPrd] = useState<string | null>(null);
  

  const handleSessionReady = (sid: string) => {
    setSessionId(sid);
  };

  const handlePRDGenerated = (prdContent: string) => {
    setGeneratedPrd(prdContent);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] px-4 py-4 flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between border-b border-primary/20 pb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Product <span className="text-primary">Requirements</span> (PRD)</h1>
          <p className="text-xs text-muted-foreground mt-1">Draft a PRD with the PRD agent, export it, or design from it: &quot;Design this&quot; writes a design spec in the Workshop.</p>
        </div>
        <Button variant="outline" asChild className="label-xs">
          <Link href="/architecture">
            <Building2 className="h-3 w-3 mr-2" />
            Architecture Studio
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[35%_20%_45%] gap-4 flex-1 min-h-0">
        <div className="flex flex-col h-full overflow-hidden border border-border/40 rounded-sm bg-background/50">
          <PrdChat 
            initialSessionId={sessionId} 
            prefill={prefill ?? undefined} 
            onSessionReady={handleSessionReady}
            onPRDGenerated={handlePRDGenerated}
          />
        </div>

        <div className="flex flex-col h-full overflow-hidden space-y-4">
          <div className="bg-background border border-primary/10 p-3 shrink-0 rounded-sm">
            <h3 className="label-xs text-primary/80">Session Status</h3>
            <p className="text-xs text-muted-foreground mt-1">Use messages to build out PRD sections. When ready, synthesize the document from the right panel.</p>
          </div>

          <div className="flex-1 overflow-auto border border-border/40 rounded-sm bg-background/50">
            <PrdStatus sessionId={sessionId} onSessionReady={handleSessionReady} />
          </div>
        </div>

        <div className="flex flex-col h-full overflow-hidden border border-border/40 rounded-sm bg-background/50">
          <PrdDocument 
            sessionId={sessionId} 
            generatedPrd={generatedPrd}
          />
        </div>
      </div>
    </div>
  );
}

function PrdPageLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-10">
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-[-0.03em]">Product <span className="text-primary">Requirements</span> (PRD)</h1>
          <p className="text-sm text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function PrdPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PrdPageLoading />}>
        <PrdPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
