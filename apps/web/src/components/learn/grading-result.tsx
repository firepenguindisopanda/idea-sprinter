"use client";

import { CheckCircle2, CircleDashed, Lightbulb } from "lucide-react";
import type { Grading } from "@/types/learning";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One grading as the learner sees it before revealing: which checks passed,
 * and for each missed one its question and why it matters - never how to pass
 * it. Core checks, the decision the exercise exists to force, come first.
 */
export function GradingResult({ grading }: Readonly<{ grading: Grading }>) {
  const checks = [...grading.checks].sort((a, b) => Number(b.core) - Number(a.core));
  return (
    <section aria-label="Grading" className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-2xl font-bold">
          {grading.passed}
          <span className="text-muted-foreground text-base font-normal"> of {grading.total} checks</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Core decision: {grading.core_passed} of {grading.core_total}
        </p>
      </div>
      <ul className="space-y-3">
        {checks.map((check) => (
          <li
            key={check.id}
            data-testid={`check-${check.id}`}
            className={cn(
              "rounded-md border p-3",
              check.passed ? "border-border" : "border-primary/40 bg-primary/5",
            )}
          >
            <div className="flex items-start gap-2">
              {check.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-label="Passed" />
              ) : (
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="Not yet" />
              )}
              <div className="space-y-1">
                <p className="text-sm">
                  {check.check}
                  {check.core && <Badge variant="outline" className="ml-2 align-middle">core</Badge>}
                  {check.not_applicable && (
                    <Badge variant="secondary" className="ml-2 align-middle">not applicable</Badge>
                  )}
                </p>
                {check.hint && (
                  <p className="flex gap-1.5 text-sm text-muted-foreground">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{check.hint}</span>
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
