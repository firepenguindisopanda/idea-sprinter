"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { api } from "@/lib/api";
import { EXAMPLE_PROMPTS } from "@/lib/example-prompts";
import type { ClarifyingQuestion, VaguenessScores, VaguenessDimension } from "@/types/workspace";
import { VaguenessReport } from "./vagueness-report";

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
    setError,
  } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

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
        try {
          const dirResponse = await api.getDirections({});
          const dirs = (dirResponse.directions ?? [])
            .filter((d: { id?: string; title?: string }) => d.id && d.title)
            .map((d: { id?: string; title?: string; description?: string; tags?: string[] }) => ({
              id: d.id ?? "",
              title: d.title ?? "",
              description: d.description ?? "",
              tags: d.tags ?? [],
            }));
          if (dirs.length >= 2) {
            setDirections(dirs);
            setPhase("direction_selection");
            setIsSubmitting(false);
            return;
          }
        } catch {
          // fall through to error
        }
        setError("Could not fetch project directions from the server.");
        setIsSubmitting(false);
        return;
      }

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

      setError("Received empty questions from the server. Please try again.");
    } catch {
      setError("Unable to connect to the backend at localhost:5001. Make sure the server is running.");
    }

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

        <div className="flex items-center justify-between gap-3">
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

          <Button variant="ghost" size="sm" onClick={() => setShowExamples(!showExamples)} className="text-xs text-muted-foreground gap-1 shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            {showExamples ? "Hide examples" : "Need inspiration?"}
            {showExamples ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {showExamples && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3" />
              Try one of these example prompts
            </p>
            <div className="grid gap-2">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setIdeaInput(ex.prompt)}
                  className="group text-left w-full rounded-lg border border-border bg-muted/30 p-3 hover:border-primary/30 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-foreground">{ex.title}</span>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {ex.prompt}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1 italic">{ex.why}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {vaguenessScores && <VaguenessReport scores={vaguenessScores} />}
    </div>
  );
}
