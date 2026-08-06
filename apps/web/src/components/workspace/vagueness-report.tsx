"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { VaguenessScores, VaguenessDimension } from "@/types/workspace";

interface VaguenessReportProps {
  scores: VaguenessScores;
}

const DIMENSION_LABELS: Record<VaguenessDimension, string> = {
  borderlineCase: "Borderline cases",
  scalarTerms: "Scalar terms",
  quantitativeImprecision: "Quantitative precision",
  subjectiveModality: "Subjective modality",
  contextDependence: "Context dependence",
};

/**
 * The clarity meters.
 *
 * DESIGN.md reserves the tertiary teal for measured-and-passing and asks that
 * linear meters stay sharp-edged. These were pill-shaped and ran on emerald,
 * amber and red - three hues from outside the palette, none of which appear
 * anywhere else in the app.
 */
export function VaguenessReport({ scores }: VaguenessReportProps) {
  const dimensions = [
    "borderlineCase",
    "scalarTerms",
    "quantitativeImprecision",
    "subjectiveModality",
    "contextDependence",
  ] as const;

  const passing = scores.thresholdMet;

  return (
    <div className="rounded-none border border-primary/25 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-primary/15 px-5 py-3">
        <span className="label-xs text-primary">Clarity</span>
        <span
          className={`label-xs inline-flex items-center gap-1.5 border px-2 py-1 ${
            passing
              ? "border-tertiary/40 bg-tertiary/10 text-tertiary"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {passing ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {passing ? "Ready" : "Needs work"}
        </span>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Overall reading, set larger than the dimensions it summarises. */}
        <div className="flex items-baseline justify-between gap-3">
          <span className="label-xs text-muted-foreground">Overall</span>
          <span className="font-mono text-xl font-bold tabular-nums text-foreground">
            {scores.overallScore.toFixed(1)}
            <span className="text-sm text-muted-foreground">/10</span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-primary/10">
          <div
            className={`h-full transition-all duration-500 ${
              passing ? "bg-tertiary" : "bg-destructive"
            }`}
            style={{ width: `${(scores.overallScore / 10) * 100}%` }}
          />
        </div>

        <div className="space-y-2.5 pt-1">
          {dimensions.map((dim) => {
            const score = scores[dim];
            const isWeak = score < 6;
            return (
              <div key={dim} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">
                  {DIMENSION_LABELS[dim]}
                </span>
                <div className="h-1 flex-1 bg-primary/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isWeak ? "bg-destructive/70" : "bg-primary"
                    }`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {scores.weakDimensions.length > 0 && !passing && (
        <div className="border-t border-primary/15 px-5 py-4">
          <p className="label-xs mb-3 text-muted-foreground">
            Questions will target
          </p>
          <ul className="space-y-1.5">
            {scores.weakDimensions.map((dim) => (
              <li
                key={dim}
                className="flex items-start gap-2 text-xs text-foreground"
              >
                <span className="mt-1 h-1 w-1 shrink-0 bg-primary" />
                {DIMENSION_LABELS[dim] || dim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
