"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Check, Copy, Download, Send, Code } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { api } from "@/lib/api";
import { useDraftStore } from "@/lib/draft-store";
import type { ProjectRequest, PRDStatusResponse } from "@/types";

interface PrdDocumentProps {
  sessionId: string | null;
  generatedPrd?: string | null;
}

export default function PrdDocument({ sessionId, generatedPrd: generatedPrdProp }: PrdDocumentProps) {
  const router = useRouter();
  const { startGeneration } = useDraftStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [prdContent, setPrdContent] = useState<string | null>(null);
  const [prdStatus, setPrdStatus] = useState<PRDStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"markdown">("markdown");
  const [copied, setCopied] = useState(false);
  const [usedAsProject, setUsedAsProject] = useState(false);
  const [sentToPipeline, setSentToPipeline] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    setPrdContent(null);
    setPrdStatus(null);
    setError(null);
    setUsedAsProject(false);
    setSentToPipeline(false);
    setAutoLoaded(false);
  }, [sessionId]);

  useEffect(() => {
    if (generatedPrdProp) {
      setPrdContent(generatedPrdProp);
    }
  }, [generatedPrdProp]);

  useEffect(() => {
    if (!sessionId) return;

    let pollingInterval: number | null = null;

    const fetchStatus = async () => {
      try {
        const status = await api.getPrdStatus(sessionId);
        setPrdStatus(status);

        // Auto-fetch PRD content when status becomes complete
        if (status.phase === "complete" && !prdContent && !loading) {
          // Inline fetch to avoid dependency on handleFetchDoc
          setLoading(true);
          setError(null);
          try {
            const data = await api.getPrdDoc(sessionId);
            setPrdContent(data.generated_prd);
            toast.success("PRD auto-loaded", {
              description: "The PRD is ready and has been loaded for you.",
            });
            setAutoLoaded(true);
            window.requestAnimationFrame(() => {
              containerRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch PRD");
          } finally {
            setLoading(false);
          }
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
      }
    };

    // Fetch once on mount
    fetchStatus();

    // Poll for completion to auto-fetch PRD
    pollingInterval = window.setInterval(fetchStatus, 5000);
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [sessionId, prdContent, loading]);

  const handleFetchDoc = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.getPrdDoc(sessionId);
      setPrdContent(data.generated_prd);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch PRD");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (prdContent) {
      await navigator.clipboard.writeText(prdContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (format: 'markdown' | 'pdf') => {
    if (!sessionId) return;

    setDownloading(true);
    try {
      const blob = await api.downloadPrd(sessionId, format);
      const url = globalThis.URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = `prd_${sessionId.slice(0, 8)}.${format === 'pdf' ? 'pdf' : 'md'}`;
      globalThis.document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PRD");
    } finally {
      setDownloading(false);
    }
  };

  const handleUseAsProjectDescription = () => {
    if (!prdContent || prdContent.includes("PRD not yet generated")) return;

    const projectRequest: ProjectRequest = {
      description: prdContent,
      frontend_framework: "",
    };

    startGeneration(projectRequest);
    setUsedAsProject(true);
    
    setTimeout(() => {
      router.push("/generate");
    }, 500);
  };

  const handleSendToPipeline = () => {
    if (!sessionId || !prdContent || prdContent.includes("PRD not yet generated")) return;

    // Store the PRD content as the project description in the draft store
    const projectRequest: ProjectRequest = {
      description: prdContent,
      frontend_framework: "",
    };

    startGeneration(projectRequest);
    setSentToPipeline(true);
    
    // Navigate to the Generate page immediately - user clicks Generate to start the pipeline
    setTimeout(() => {
      router.push("/generate");
    }, 500);
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background border-2 border-primary/10 p-4">
        <div className="shrink-0 pb-2 border-b border-primary/10">
          <h3 className="text-xs font-mono uppercase text-primary/80">PRD Document</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Start a PRD session to generate a document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full min-h-0 bg-background border-2 border-primary/10"
    >
      {/* Sticky action row */}
      <div className="sticky top-0 bg-background z-10 pb-2 border-b border-primary/10 px-4 pt-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase text-primary/80">PRD Document</h3>
          {autoLoaded && (
            <span className="label-xs text-tertiary border border-tertiary/30 bg-tertiary/10 px-2 py-0.5">
              Auto-loaded
            </span>
          )}
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {!prdContent && !loading && (
          <button
            onClick={handleFetchDoc}
            className="label-xs w-full bg-warning/10 py-2 px-3 border border-warning/20 rounded-none hover:bg-warning/20 transition-colors"
          >
            Fetch PRD
          </button>
        )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-warning" />
          <span className="text-xs text-muted-foreground ml-2">Loading...</span>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{error}</p>
          <button
            onClick={handleFetchDoc}
            className="label-xs border border-primary/10 py-1 px-2 hover:bg-primary/5 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {prdContent && !loading && (
        <div className="space-y-3">
          <div className="flex gap-2 border-b border-primary/10 pb-2">
            <button
              onClick={() => setViewMode("markdown")}
              className={`label-xs flex items-center gap-1 px-2 py-1 transition-colors ${
                viewMode === "markdown" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3 h-3" />
              Markdown
            </button>
            <button
              onClick={handleCopy}
              className="label-xs ml-auto flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-tertiary" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* PRD Content - scrollable */}
          <div className="text-xs">
            <Markdown enableDiagrams className="max-w-none">{prdContent}</Markdown>
          </div>

          {/* Judge score display */}
          {prdStatus?.phase === "complete" && (
            <div className="label-xs flex items-center justify-between border border-primary/10 p-2">
              <span className="text-muted-foreground">Judge Score:</span>
              <span className={prdStatus?.judge_approved ? "text-tertiary" : "text-warning"}>
                {prdStatus?.judge_score || "?"}/10
              </span>
            </div>
          )}

          {/* Action buttons - sticky at bottom */}
          <div className="sticky bottom-0 bg-background pt-2 border-t border-primary/10 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload("markdown")}
                disabled={downloading}
                className="label-xs flex-1 flex items-center justify-center gap-1 py-2 px-2 border border-primary/10 rounded-none hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                MD
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloading}
                className="label-xs flex-1 flex items-center justify-center gap-1 py-2 px-2 border border-primary/10 rounded-none hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3" />
                PDF
              </button>
            </div>

            <button
              onClick={handleUseAsProjectDescription}
              disabled={usedAsProject || !prdContent || prdContent.includes("PRD not yet generated")}
              className="label-xs w-full flex items-center justify-center gap-2 py-2 px-3 border border-primary/10 rounded-none hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {usedAsProject ? (
                <>
                  <Check className="w-3 h-3 text-tertiary" />
                  Ready
                </>
              ) : (
                <>
                  <Code className="w-3 h-3" />
                  Use as Project Description
                </>
              )}
            </button>

            <button
              onClick={handleSendToPipeline}
              disabled={sentToPipeline || !prdContent || prdContent.includes("PRD not yet generated")}
              className="label-xs w-full flex items-center justify-center gap-2 py-2 px-3 bg-warning/10 border border-warning/20 rounded-none hover:bg-warning/20 transition-colors disabled:opacity-50"
              title="Send PRD to SRS pipeline on the Generate page"
            >
              {sentToPipeline ? (
                <>
                  <Check className="w-3 h-3 text-tertiary" />
                  Ready to Generate
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Send to Pipeline
                </>
              )}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
