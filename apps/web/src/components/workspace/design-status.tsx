"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { QualitySidebar } from "./quality-sidebar";
import type { DesignFinding, DesignProgress, DesignResult, DesignStatus, KeyGrade } from "@/types/workspace";

/**
 * What a design run checked, and what it still found.
 *
 * A design is written by one writer from one checked plan; no critic, skeptic
 * or judge runs on it, so there are no verdicts and no scores to show. What
 * there is instead is checked in code, and the status says exactly which of
 * those checks passed - never "approved". A finding is shown, not fixed:
 * refining one section can break its agreement with the plan, and nothing can
 * re-check a refined section yet. For the same reason the Workshop offers no
 * refine on a design's sections (`ProgressiveDoc`).
 */

// The plan gets its first attempt and two revisions (`LEDGER_REVISIONS`).
const PLAN_ROUNDS = 3;

const STATUS: Record<DesignStatus, { label: string; tone: string; means: string }> = {
  checked: {
    label: "Checked against its plan",
    tone: "text-tertiary border-tertiary/30 bg-tertiary/10",
    means: "The plan passed its checks and the document passed its own. Both are checked in code.",
  },
  ledger_unresolved: {
    label: "Plan unresolved",
    tone: "text-warning border-warning/30 bg-warning/10",
    means:
      "The plan still failed some of its checks after its revisions. The document was written from it anyway, and says so at the top.",
  },
  document_unresolved: {
    label: "Document unresolved",
    tone: "text-warning border-warning/30 bg-warning/10",
    means: "The plan passed its checks. The document still fails some of its own after one revision.",
  },
  failed: {
    label: "Not written",
    tone: "text-destructive border-destructive/30 bg-destructive/10",
    means: "The run ended before a design was written.",
  },
};

function duration(seconds: number): string {
  const whole = Math.round(seconds);
  return whole < 60 ? `${whole} s` : `${Math.floor(whole / 60)} min ${whole % 60} s`;
}

function Findings({ findings }: { findings: Array<Omit<DesignFinding, "source"> & { source?: string }> }) {
  return (
    <ul className="space-y-2 text-xs">
      {findings.map((f, i) => (
        <li key={i} className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {f.source && (
              <span className="label-xs rounded border border-border px-1 py-0.5 text-muted-foreground">
                {f.source === "ledger" ? "Plan" : "Document"}
              </span>
            )}
            <span className="font-mono text-muted-foreground">{f.code}</span>
            {f.field && <span className="font-mono text-muted-foreground">at {f.field}</span>}
          </div>
          <p className="leading-relaxed text-muted-foreground">{f.detail}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * A keyed design's grade against its exercise's answer key. Beside the status,
 * never in place of it: the grader's model is still an open question, so the
 * grade is provisional and decides nothing.
 */
function KeyGradeNote({ grade }: { grade: KeyGrade }) {
  return (
    <div className="space-y-1 rounded-sm border border-border bg-background/50 p-3">
      <p className="text-xs font-medium text-foreground">Answer key · provisional</p>
      <p className="text-xs text-muted-foreground">
        {grade.passed} of {grade.total} checks · {grade.core_passed} of {grade.core_total} core
      </p>
      <p className="label-xs leading-relaxed text-muted-foreground">
        Graded by {grade.model}. The grader&apos;s model is still being chosen, so this grade decides nothing.
      </p>
    </div>
  );
}

/** A finished design's status and findings. Also shown on the saved project. */
export function DesignSummary({ design }: { design: DesignResult }) {
  const status = STATUS[design.status];
  const passed = design.status === "checked";
  const { tokens, seconds } = design;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium ${status.tone}`}>
        {passed ? (
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span>{status.label}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{status.means}</p>

      {design.findings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">What it still fails</p>
          <Findings findings={design.findings} />
        </div>
      )}

      {design.key_grade && <KeyGradeNote grade={design.key_grade} />}

      {typeof tokens?.calls === "number" && typeof tokens.total === "number" && typeof seconds === "number" && (
        <p className="label-xs text-muted-foreground">
          {tokens.calls} {tokens.calls === 1 ? "model call" : "model calls"} ·{" "}
          {tokens.total.toLocaleString("en-US")} tokens · {duration(seconds)}
        </p>
      )}
    </div>
  );
}

function Progress({ progress, running }: { progress: DesignProgress; running: boolean }) {
  const writing = progress.stage === "writer";
  const grading = progress.stage === "grade";
  const label = grading
    ? "Grading against the exercise's answer key"
    : writing
      ? progress.round > 1
        ? "Revising the design"
        : "Writing the design"
      : "Planning the design";

  return (
    <div className="space-y-3">
      <div className="label-xs flex items-center gap-2 text-primary">
        {running && <span className="pulse-rule inline-block h-2 w-2 bg-primary" />}
        {label}
        {!writing && !grading && ` · round ${progress.round} of ${PLAN_ROUNDS}`}
      </div>

      {progress.ledgerRounds.length > 0 && (
        <ul className="space-y-2">
          {progress.ledgerRounds.map((r) => (
            <li key={r.round} className="space-y-1.5 rounded-sm border border-border bg-background/50 p-3">
              <p className="text-xs font-medium text-foreground">
                Round {r.round}:{" "}
                {r.passed
                  ? "passed"
                  : `${r.findings.length} ${r.findings.length === 1 ? "check" : "checks"} failed`}
              </p>
              {!r.passed && <Findings findings={r.findings} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The Workshop's side panel for a design run: its progress, then its result. */
export function DesignStatusPanel() {
  const design = useWorkspaceStore((s) => s.design);
  const progress = useWorkspaceStore((s) => s.designProgress);
  const running = useWorkspaceStore((s) => s.phase === "generating");

  if (!design && !progress) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Checks</h2>
      {design ? <DesignSummary design={design} /> : <Progress progress={progress!} running={running} />}
    </div>
  );
}

/**
 * What the run reports beside the document: the design status for a design
 * run, the review sidebar for the old pipeline. Chosen by what the store
 * holds, so a run started before a reload reports the same way after it.
 */
export function RunReport() {
  const isDesign = useWorkspaceStore((s) => s.design !== null || s.designProgress !== null);
  return isDesign ? <DesignStatusPanel /> : <QualitySidebar />;
}
