"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { VaguenessScores, VaguenessDimension } from "@/types/workspace";

interface VaguenessReportProps {
  scores: VaguenessScores;
}

const DIMENSION_LABELS: Record<VaguenessDimension, string> = {
  borderlineCase: "Borderline Cases",
  scalarTerms: "Scalar Terms",
  quantitativeImprecision: "Quantitative Precision",
  subjectiveModality: "Subjective Modality",
  contextDependence: "Context Dependence",
};

export function VaguenessReport({ scores }: VaguenessReportProps) {
  const dimensions = [
    "borderlineCase",
    "scalarTerms",
    "quantitativeImprecision",
    "subjectiveModality",
    "contextDependence",
  ] as const;

  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          Vagueness Analysis
        </h3>
        {scores.thresholdMet ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready to Generate
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs Clarification
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Overall</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              scores.thresholdMet ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${(scores.overallScore / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-foreground">
          {scores.overallScore.toFixed(1)}/10
        </span>
      </div>

      <div className="space-y-2">
        {dimensions.map((dim) => {
          const score = scores[dim];
          const isWeak = score < 6;
          return (
            <div key={dim} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 truncate">
                {DIMENSION_LABELS[dim]}
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isWeak ? "bg-red-400" : "bg-primary"
                  }`}
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                {score}/10
              </span>
            </div>
          );
        })}
      </div>

      {scores.weakDimensions.length > 0 && !scores.thresholdMet && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Targeting:
          </p>
          <ul className="space-y-0.5">
            {scores.weakDimensions.map((dim) => (
              <li key={dim} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {DIMENSION_LABELS[dim] || dim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
