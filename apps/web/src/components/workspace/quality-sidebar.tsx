"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { formatRole } from "@/lib/project-artifacts";
import { AlertTriangle, ChevronDown, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import type { SectionReview } from "@/types/workspace";

/**
 * The review scars a spec carries.
 *
 * Every section is attacked by a critic, a skeptic and a judge before it is
 * shown. The backend has always run all three; the workspace dropped the
 * results in its event translation, so users saw a clean document with no sign
 * that anything had been scrutinised - the one thing that distinguishes this
 * from pasting a brief into a chatbot.
 */

// Matches the convention already used in results-display.tsx.
function scoreClass(score: number): string {
  if (score >= 8) return "text-tertiary border-tertiary/20 bg-tertiary/10";
  if (score >= 5) return "text-warning border-warning/20 bg-warning/10";
  return "text-destructive border-destructive/20 bg-destructive/10";
}

function severityClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") return "text-destructive border-destructive/20 bg-destructive/10";
  if (s === "medium") return "text-warning border-warning/20 bg-warning/10";
  return "text-muted-foreground border-border bg-muted/50";
}

function ReviewCard({ review }: { review: SectionReview }) {
  const [expanded, setExpanded] = useState(false);
  const { critic, skeptic, judge } = review;
  const attacks = skeptic?.attackVectors ?? [];
  const hasDetail =
    attacks.length > 0 ||
    (critic?.dimensions?.length ?? 0) > 0 ||
    !!critic?.summary ||
    !!judge?.feedback;

  return (
    <div className="rounded-sm border border-border bg-background/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          disabled={!hasDetail}
          className="flex items-center gap-1.5 text-sm font-medium text-left min-w-0 disabled:cursor-default"
          aria-expanded={expanded}
        >
          {hasDetail &&
            (expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ))}
          <span className="truncate">{formatRole(review.role)}</span>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {judge && (
            <span
              className={`text-xs font-mono px-1.5 py-0.5 border rounded ${scoreClass(judge.score)}`}
              title={judge.approved ? "Approved by the judge" : "Not approved by the judge"}
            >
              {judge.score}/10
            </span>
          )}
          {judge &&
            (judge.approved ? (
              <ShieldCheck className="h-3.5 w-3.5 text-tertiary" aria-label="Approved" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-warning" aria-label="Not approved" />
            ))}
        </div>
      </div>

      <div className="label-xs flex flex-wrap gap-1.5">
        {typeof critic?.score === "number" && (
          <span className={`px-1.5 py-0.5 border rounded ${scoreClass(critic.score)}`}>
            Critic {critic.score.toFixed(1)}
          </span>
        )}
        {skeptic?.riskLevel && (
          <span className={`px-1.5 py-0.5 border rounded ${severityClass(skeptic.riskLevel)}`}>
            {skeptic.riskLevel} risk
          </span>
        )}
        {attacks.length > 0 && (
          <span className="px-1.5 py-0.5 border rounded text-muted-foreground border-border">
            {attacks.length} {attacks.length === 1 ? "attack" : "attacks"}
          </span>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 pt-1 text-xs">
          {judge?.feedback && (
            <div className="space-y-0.5">
              <p className="text-muted-foreground leading-relaxed">{judge.feedback}</p>
              {judge.recommendedAction && (
                <p className="label-xs text-muted-foreground">
                  Verdict: {judge.recommendedAction}
                  {judge.issuesCount > 0 &&
                    ` · ${judge.issuesCount} ${judge.issuesCount === 1 ? "issue" : "issues"}`}
                </p>
              )}
            </div>
          )}

          {/* The critic's own summary. Live runs return a full paragraph here
              and it was being carried across the wire and then dropped. */}
          {critic?.summary && (
            <p className="text-muted-foreground leading-relaxed">{critic.summary}</p>
          )}

          {attacks.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-medium text-foreground">Attack vectors</p>
              {attacks.map((a, i) => (
                <div key={a.id || i} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`label-xs px-1 py-0.5 border rounded ${severityClass(a.severity)}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-muted-foreground">{a.category}</span>
                    {a.impacted_dimension && (
                      <span className="text-muted-foreground truncate">
                        · {a.impacted_dimension}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{a.description}</p>
                  {a.suggested_fix && (
                    <p className="text-muted-foreground leading-relaxed">
                      Fix: {a.suggested_fix}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {(critic?.dimensions?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <p className="font-medium text-foreground">Critic dimensions</p>
              {critic!.dimensions.map((d, i) => (
                <div key={d.name || i} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-8 font-mono">{d.score}/10</span>
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-foreground">{d.name}</span>
                    {/* A dimension's `issues` are the actionable half and were
                        not rendered at all. Real critic output puts praise in
                        `justification` and the concrete problems here, so a
                        dimension with issues leads with them and keeps the
                        justification for the ones that found nothing wrong. */}
                    {d.issues && d.issues.length > 0 ? (
                      <ul className="list-disc pl-4 text-muted-foreground leading-relaxed">
                        {d.issues.map((issue, j) => (
                          <li key={j}>{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{d.justification}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function QualitySidebar() {
  const reviews = useWorkspaceStore((s) => s.reviews);
  const contradictions = useWorkspaceStore((s) => s.contradictions);
  const documentSections = useWorkspaceStore((s) => s.documentSections);

  const list = Object.values(reviews);
  if (list.length === 0 && contradictions.length === 0) return null;

  // Order the review cards the way the document itself is ordered, so the
  // sidebar reads alongside the sections rather than in arrival order.
  const order = new Map(documentSections.map((s, i) => [s.id, s.order ?? i]));
  const sorted = [...list].sort(
    (a, b) => (order.get(a.sectionId) ?? 0) - (order.get(b.sectionId) ?? 0),
  );

  const judged = list.filter((r) => r.judge);
  const approved = judged.filter((r) => r.judge!.approved).length;
  const avg =
    judged.length > 0
      ? judged.reduce((sum, r) => sum + r.judge!.score, 0) / judged.length
      : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">Review</h2>
          {judged.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {approved}/{judged.length} approved
              {avg !== null && ` · avg ${avg.toFixed(1)}`}
            </span>
          )}
        </div>
        {/* Say how much of the document was actually attacked.
            A live run reviews the roles in `SKEPTIC_ENABLED_ROLES` and the
            phases with LLM review turned on - 3 of 11 sections on the run this
            was checked against - so "3/3 approved" next to an 11-section
            document reads as though the whole thing passed. Claiming more
            scrutiny than happened is the one failure this panel cannot afford,
            since its entire purpose is to be the evidence. */}
        {documentSections.length > list.length && (
          <p className="text-xs text-muted-foreground">
            {list.length} of {documentSections.length} sections were put through
            adversarial review.
          </p>
        )}
      </div>

      {contradictions.length > 0 && (
        <div className="accent-note border-warning bg-warning/10 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            {contradictions.length} cross-agent{" "}
            {contradictions.length === 1 ? "contradiction" : "contradictions"}
          </div>
          <ul className="space-y-1.5 text-xs">
            {contradictions.map((c, i) => (
              <li key={i} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`label-xs px-1 py-0.5 border rounded ${severityClass(c.severity)}`}
                  >
                    {c.severity}
                  </span>
                  {c.roles && c.roles.length > 0 && (
                    <span className="text-muted-foreground">
                      {c.roles.map(formatRole).join(", ")}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">{c.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((review) => (
          <ReviewCard key={review.sectionId} review={review} />
        ))}
      </div>
    </div>
  );
}
