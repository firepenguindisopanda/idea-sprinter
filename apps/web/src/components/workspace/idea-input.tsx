"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ClarifyingQuestion, VaguenessScores, VaguenessDimension } from "@/types/workspace";
import { VaguenessReport } from "./vagueness-report";

const FALLBACK_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "q1",
    question: "Who is the primary user of this product?",
    type: "choice",
    options: ["End consumers (B2C)", "Other businesses (B2B)", "Internal team use"],
    answer: null,
  },
  {
    id: "q2",
    question: "What platform do you want to target first?",
    type: "choice",
    options: ["Web app", "Mobile app", "Both", "Desktop"],
    answer: null,
  },
  {
    id: "q3",
    question: "What is the core problem this product solves?",
    type: "free_text",
    answer: null,
  },
  {
    id: "q4",
    question: "Do you have any key differentiators vs existing solutions?",
    type: "free_text",
    answer: null,
  },
];

export function IdeaInput() {
  const {
    ideaInput,
    setIdeaInput,
    startClarifying,
    setQuestions,
    phase,
    vaguenessScores,
    setVaguenessScores,
    setPhase,
    setDirections,
    addChatMessage,
  } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ideaInput.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await api.evaluateVagueness(ideaInput);

      const scores: VaguenessScores = {
        borderlineCase: response.scores.borderline_case,
        scalarTerms: response.scores.scalar_terms,
        quantitativeImprecision: response.scores.quantitative_imprecision,
        subjectiveModality: response.scores.subjective_modality,
        contextDependence: response.scores.context_dependence,
        overallScore: response.overall_score,
        thresholdMet: response.threshold_met,
        weakDimensions: response.weak_dimensions as VaguenessDimension[],
      };
      setVaguenessScores(scores);

      if (scores.thresholdMet) {
        addChatMessage({
          role: "system",
          content: "Your idea is clear and specific enough to generate a spec. Let's pick a direction.",
        });
        setPhase("direction_selection");
        setIsSubmitting(false);
        return;
      }

      // Use targeted questions from the evaluator, or fall back
      const questions: ClarifyingQuestion[] = (response.targeted_questions ?? []).map(
        (q: { id?: string; question?: string; type?: string; options?: string[] }, i: number) => ({
          id: q.id ?? `q${i + 1}`,
          question: q.question ?? "",
          type: (q.type === "choice" ? "choice" : "free_text") as "choice" | "free_text",
          options: q.options,
          answer: null,
        })
      );

      if (questions.length > 0 && questions.every((q) => q.question)) {
        setQuestions(questions);
        startClarifying();
        setIsSubmitting(false);
        return;
      }
    } catch {
      // API unavailable — use fallback
    }

    // Fallback: use generic questions
    setQuestions(FALLBACK_QUESTIONS);
    startClarifying();
    setIsSubmitting(false);
  };

  if (phase !== "idea_input" && phase !== "evaluating") {
    return (
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm opacity-70 transition-opacity hover:opacity-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Initial Idea</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ideaInput}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            What are you building?
          </h2>
          <p className="text-sm text-muted-foreground">
            Describe your idea in a sentence or two. We&apos;ll analyze it for clarity and help you refine it.
          </p>
        </div>

        <textarea
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          placeholder="I want to build a..."
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-shadow"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!ideaInput.trim() || isSubmitting}
            size="lg"
            className="gap-2"
          >
            {isSubmitting ? (
              <>Analyzing...</>
            ) : (
              <>
                Start Crafting
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Need inspiration?
          </Button>
        </div>
      </div>

      {vaguenessScores && <VaguenessReport scores={vaguenessScores} />}
    </div>
  );
}
