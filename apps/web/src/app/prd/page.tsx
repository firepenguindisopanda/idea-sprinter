"use client";

import { Suspense, useState } from "react";
import ProtectedRoute from "@/components/protected-route";
import PrdChat from "@/components/prd/prd-chat";
import PrdStatus from "@/components/prd/prd-status";
import PrdDocument from "@/components/prd/prd-document";
import { useSearchParams } from "next/navigation";
import { useDraftStore } from "@/lib/draft-store";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles } from "lucide-react";

function PrdPageContent() {
  const params = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(params?.get('session_id') ?? null);
  
  const prefill = params?.get('prefill');
  const ideationDraft = useDraftStore((state) => state.ideationDraft);
  const hasIdeationExample = !!ideationDraft?.selectedExample;

  const handleSessionReady = (sid: string) => {
    setSessionId(sid);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-10">
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div>
          <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">Product <span className="text-amber-500">Requirements</span> (PRD)</h1>
          <p className="text-sm text-muted-foreground mt-2">Draft and refine a PRD with the PRD agent — synthesize to a full document and export or use it to start the SRS generation.</p>
        </div>
      </div>

      {hasIdeationExample && !prefill && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-mono uppercase text-amber-600">Ideation example available</p>
              <p className="text-xs text-muted-foreground">Import your selected concept to start building the PRD</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const example = ideationDraft?.selectedExample;
              if (example) {
                const encoded = encodeURIComponent(example);
                window.location.href = `/prd?prefill=${encoded}`;
              }
            }}
            className="rounded-none font-mono uppercase text-[10px] border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          >
            <FileText className="h-3 w-3 mr-2" />
            Import Example
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PrdChat initialSessionId={sessionId} onSessionReady={handleSessionReady} />
        </div>

        <aside className="space-y-6">
          <div className="bg-background border-2 border-primary/10 p-4">
            <h3 className="text-xs font-mono uppercase text-primary/60">Session</h3>
            <p className="text-sm text-muted-foreground mt-2">Use messages to build out PRD sections. When ready, synthesize the document from the right panel.</p>
          </div>

          <PrdStatus sessionId={sessionId} onSessionReady={handleSessionReady} />

          <PrdDocument sessionId={sessionId} />
        </aside>
      </div>
    </div>
  );
}

function PrdPageLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-10">
      <div className="flex items-center justify-between border-b border-primary/20 pb-6">
        <div>
          <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter">Product <span className="text-amber-500">Requirements</span> (PRD)</h1>
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
