"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Network, ScrollText } from "lucide-react";
import { api } from "@/lib/api";
import type { ArchitectureDecisionRecord, ArchitectureSessionSummary } from "@/types";

/**
 * Architecture sessions and the ADRs they produced.
 *
 * `/architecture` had no memory: sessions and decision records were addressable
 * only by a URL parameter, so leaving the page lost them, and an ADR meant to be
 * defensible in six months could not be found in six minutes.
 * `listArchitectureSessions` and `listDecisions` had been written and were
 * called from nowhere.
 */

const STATUS_CLASS: Record<string, string> = {
  completed: "border-tertiary/30 text-tertiary bg-tertiary/5",
  created: "border-muted-foreground/30 text-muted-foreground",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ArchitectureList() {
  const [sessions, setSessions] = useState<ArchitectureSessionSummary[]>([]);
  const [decisions, setDecisions] = useState<ArchitectureDecisionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Settled rather than all: one endpoint failing should not blank the other.
    Promise.allSettled([api.listArchitectureSessions(10), api.listDecisions({ limit: 10 })])
      .then(([sessionResult, decisionResult]) => {
        if (cancelled) return;
        if (sessionResult.status === "fulfilled") setSessions(sessionResult.value);
        if (decisionResult.status === "fulfilled") setDecisions(decisionResult.value);
        if (sessionResult.status === "rejected" && decisionResult.status === "rejected") {
          setError("Could not load your architecture work.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show and nothing went wrong: stay out of the way rather than
  // adding an empty panel to a dashboard that already has several.
  if (!isLoading && !error && sessions.length === 0 && decisions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs font-bold uppercase text-primary/80">Architecture:</span>
        <div className="h-px flex-1 bg-primary/10" />
        <span className="font-mono text-xs text-muted-foreground">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"} · {decisions.length}{" "}
          {decisions.length === 1 ? "ADR" : "ADRs"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="label-xs">Loading architecture...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessions.length > 0 && (
            <div className="border border-primary/10 bg-muted/20 rounded-sm p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-muted-foreground">
                <Network className="h-3.5 w-3.5 text-primary" />
                Sessions
              </div>
              <ul className="space-y-1">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/architecture?session_id=${session.id}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-sm hover:bg-primary/5 transition-colors group"
                    >
                      <span className="text-sm truncate group-hover:text-primary transition-colors">
                        {session.project_name || "Untitled session"}
                      </span>
                      <span
                        className={`label-xs shrink-0 px-1.5 py-0.5 border rounded ${
                          STATUS_CLASS[session.status] ?? "border-primary/20 text-primary/80"
                        }`}
                      >
                        {session.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {decisions.length > 0 && (
            <div className="border border-primary/10 bg-muted/20 rounded-sm p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-muted-foreground">
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                Decision Records
              </div>
              <ul className="space-y-1">
                {decisions.map((decision) => (
                  <li key={decision.id}>
                    <Link
                      href={`/architecture?session_id=${decision.session_id}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-sm hover:bg-primary/5 transition-colors group"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm truncate group-hover:text-primary transition-colors">
                          {decision.title}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {decision.chosen_pattern}
                          {decision.created_at && ` · ${formatDate(decision.created_at)}`}
                        </span>
                      </span>
                      {decision.edited_by_user && (
                        <span className="label-xs shrink-0 px-1.5 py-0.5 border border-primary/20 text-primary/80 rounded">
                          Edited
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
