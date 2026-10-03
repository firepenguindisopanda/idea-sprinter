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
        <h3 className="text-xs font-mono uppercase text-primary/80">PRD Status</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Start a PRD session to see progress.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background border-2 border-primary/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase text-primary/80">PRD Status</h3>
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
        <p className="text-xs text-destructive">{error}</p>
      )}

      {status?.phase && (
        <div className="flex items-center gap-2">
          <span className="label-xs text-muted-foreground">Phase:</span>
          <span className={`text-xs font-mono ${status.phase === "complete" ? "text-tertiary" : "text-warning"}`}>
            {PHASE_LABELS[status.phase] || status.phase}
          </span>
        </div>
      )}

      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="label-xs flex items-center justify-between text-muted-foreground">
            <span>Requirements</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="h-1 bg-primary/10">
            <div 
              className="h-full bg-warning transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {lastUpdated && !error && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <div className="space-y-2">
        <h4 className="label-xs text-primary/80">Requirements</h4>
        {requirementsList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No requirements yet</p>
        ) : (
          <ul className="space-y-1">
            {requirementsList.map(([key, isComplete]) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                {isComplete ? (
                  <CheckCircle2 className="w-3 h-3 text-tertiary" />
                ) : (
                  <Circle className="w-3 h-3 text-warning" />
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
          <h4 className="label-xs text-warning">Missing</h4>
          <ul className="space-y-1">
            {status.missing_sections.map((section) => (
              <li key={section} className="flex items-center gap-2 text-xs text-warning">
                <Circle className="w-3 h-3" />
                {REQUIREMENT_LABELS[section] || section}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status?.follow_up_count !== undefined && status.follow_up_count > 0 && (
        <div className="text-xs text-muted-foreground">
          Follow-ups: {status.follow_up_count}/5
        </div>
      )}
    </div>
  );
}
