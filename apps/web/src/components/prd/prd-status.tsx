"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { PRDStatusResponse } from "@/types";

interface PrdStatusProps {
  sessionId: string | null;
  onSessionReady?: (sessionId: string) => void;
}

const POLL_INTERVAL_MS = 5000;

const REQUIREMENT_LABELS: Record<string, string> = {
  vision: "Product Vision",
  features: "Key Features",
  user_stories: "User Stories",
  acceptance_criteria: "Acceptance Criteria",
  assumptions: "Assumptions & Constraints",
};

const PHASE_LABELS: Record<string, string> = {
  evaluating: "Evaluating",
  collecting: "Collecting Info",
  generating: "Generating PRD",
  complete: "Complete",
};

export default function PrdStatus({ sessionId, onSessionReady }: PrdStatusProps) {
  const [status, setStatus] = useState<PRDStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async (sid: string) => {
    if (!sid) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPrdStatus(sid);
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchStatus(sessionId);
    }
  }, [sessionId, fetchStatus]);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      fetchStatus(sessionId);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId, fetchStatus]);

  useEffect(() => {
    if (sessionId && onSessionReady) {
      onSessionReady(sessionId);
    }
  }, [sessionId, onSessionReady]);

  const handleRefresh = () => {
    if (sessionId) {
      fetchStatus(sessionId);
    }
  };

  const requirements = status?.requirements_status ?? {};
  const requirementsList = Object.entries(requirements);
  const completedCount = Object.values(requirements).filter(Boolean).length;
  const totalCount = requirementsList.length;

  if (!sessionId) {
    return (
      <div className="bg-background border-2 border-primary/10 p-4">
        <h3 className="text-xs font-mono uppercase text-primary/60">PRD Status</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Start a PRD session to see progress.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background border-2 border-primary/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase text-primary/60">PRD Status</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 hover:bg-primary/5 rounded transition-colors"
          title="Refresh status"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin text-primary/60" />
          ) : (
            <RefreshCw className="w-3 h-3 text-primary/60" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {status?.phase && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Phase:</span>
          <span className={`text-xs font-mono ${status.phase === "complete" ? "text-green-500" : "text-amber-500"}`}>
            {PHASE_LABELS[status.phase] || status.phase}
          </span>
        </div>
      )}

      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-muted-foreground">
            <span>Requirements</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="h-1 bg-primary/10">
            <div 
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {lastUpdated && !error && (
        <p className="text-[10px] text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-2">
        <h4 className="text-[10px] font-mono uppercase text-primary/40">Requirements</h4>
        {requirementsList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No requirements yet</p>
        ) : (
          <ul className="space-y-1">
            {requirementsList.map(([key, isComplete]) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                {isComplete ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <Circle className="w-3 h-3 text-amber-500" />
                )}
                <span className={isComplete ? "text-muted-foreground line-through" : ""}>
                  {REQUIREMENT_LABELS[key] || key}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status?.missing_sections && status.missing_sections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono uppercase text-amber-500/60">Missing</h4>
          <ul className="space-y-1">
            {status.missing_sections.map((section) => (
              <li key={section} className="flex items-center gap-2 text-xs text-amber-500">
                <Circle className="w-3 h-3" />
                {REQUIREMENT_LABELS[section] || section}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status?.follow_up_count !== undefined && status.follow_up_count > 0 && (
        <div className="text-[10px] text-muted-foreground">
          Follow-ups: {status.follow_up_count}/5
        </div>
      )}

      {status?.judge_approved !== undefined && status.phase === "complete" && (
        <div className={`space-y-2 p-3 border ${status.judge_approved ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
          <div className="flex items-center gap-2">
            {status.judge_approved ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            )}
            <span className={`text-xs font-mono uppercase ${status.judge_approved ? "text-green-500" : "text-amber-500"}`}>
              {status.judge_approved ? "Judge Approved" : "Awaiting Approval"}
            </span>
          </div>
          {status.judge_score !== undefined && status.judge_score !== null && (
            <div className="text-[10px] text-muted-foreground">
              Score: {status.judge_score}/10
            </div>
          )}
          {status.judge_feedback && !status.judge_approved && (
            <div className="text-[10px] text-amber-500/80 mt-2">
              {status.judge_feedback.slice(0, 200)}
              {status.judge_feedback.length > 200 && "..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
