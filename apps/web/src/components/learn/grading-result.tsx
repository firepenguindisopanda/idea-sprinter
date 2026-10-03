"use client";

import { BookOpen, CheckCircle2, CircleDashed, Lightbulb } from "lucide-react";
import type { Grading } from "@/types/learning";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One grading as the learner sees it before revealing: which checks passed,
 * and for each missed one its question, why it matters and what to read -
 * never how to pass it. Core checks, the decision the exercise exists to
 * force, come first.
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
      {/* The grader is measured, and lenient: against hand-checked labels it
          passes roughly one check in eight that it should not, and almost
          never fails one it should pass. So the caution is about passes. */}
      <p role="note" className="text-sm text-muted-foreground">
        These grades are provisional. The automatic grader is sometimes too generous: it can
        pass a check your draft has not fully earned. A check it marks as missed is usually
        right. Compare with the answers when you reveal them.
      </p>
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
                {check.read && check.read.length > 0 && (
                  <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 self-center" aria-hidden />
                    <span>Read:</span>
                    {check.read.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        {link.title}
                      </a>
                    ))}
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
