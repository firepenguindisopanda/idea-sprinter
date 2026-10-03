"use client";

import { useRef, useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipForward, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { serverMessage } from "@/lib/server-message";
import type { DirectionOption } from "@/types/workspace";
import { HybridChatInput } from "./hybrid-chat-input";

export function ClarifyingQuestions() {
  const {
    ideaInput,
    questions,
    currentQuestionIndex,
    currentQuestion,
    canGoPrevious,
    canGoNext,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    setDirections,
    phase,
    addChatMessage,
    setError,
  } = useWorkspace();

  const [localAnswer, setLocalAnswer] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);

  if (!currentQuestion) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No questions available.
      </div>
    );
  }

  const fetchDirections = async () => {
    // One request per user, however many times they press the button.
    //
    // Neither handler awaits this call and there was no in-flight flag, so a
    // double-click - or Enter followed by a click - fired `/directions` twice.
    // Both are full authoring-tier calls; in a real session the duplicate ran
    // for 142 seconds and landed in the middle of a generation the user had
    // already started from the first one's results.
    //
    // A ref rather than the state flag because two clicks in the same tick see
    // the same render's state, and that is exactly the case being prevented.
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);
    setIsFetching(true);

    // Keys become prompt labels on the backend, so send the question text and
    // the original idea rather than opaque ids like "q1".
    const answers: Record<string, string> = {};
    if (ideaInput?.trim()) answers["The project idea"] = ideaInput.trim();
    for (const q of questions) {
      if (q.answer) answers[q.question] = q.answer;
    }
    try {
      const response = await api.getDirections(answers);
      const dirs: DirectionOption[] = (response.directions ?? []).map(
        (d: { id?: string; title?: string; description?: string; tags?: string[] }) => ({
          id: d.id ?? "",
          title: d.title ?? "",
          description: d.description ?? "",
          tags: d.tags ?? [],
        })
      );
      if (dirs.length >= 2 && dirs.every((d) => d.id && d.title)) {
        setDirections(dirs);
        return;
      }
      setError("Received insufficient directions from the server. Please try again.");
    } catch (err) {
      setError(serverMessage(err));
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  };

  const handleAnswer = () => {
    if (!localAnswer.trim()) return;

    answerQuestion(currentQuestion.id, localAnswer.trim());

    if (canGoNext) {
      nextQuestion();
      setLocalAnswer("");
    } else {
      fetchDirections();
    }
  };

  const handleSkip = () => {
    if (canGoNext) {
      nextQuestion();
      setLocalAnswer("");
    } else {
      fetchDirections();
    }
  };

  const handleChatSend = (_message: string) => {
    addChatMessage({
      role: "system",
      content: `Thanks for your note. When you're ready, please answer: "${currentQuestion.question}"`,
    });
  };

  const answeredQuestions = questions.filter((q) => q.answer !== null);

  if (phase !== "clarifying_questions" && phase !== "idea_input") {
    return (
      <div className="rounded-sm border border-primary/25 bg-card p-4 opacity-70 transition-opacity hover:opacity-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Clarifying Questions</h3>
            <p className="text-sm text-muted-foreground mt-1">{answeredQuestions.length} questions answered</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-primary/25 bg-card p-6 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-lg text-foreground tracking-tight">Sharpening your brief</span>
          <span className="text-muted-foreground">
            {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden bg-primary/10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-base font-medium text-foreground">
          {currentQuestion.question}
        </p>

        {currentQuestion.type === "choice" && currentQuestion.options ? (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setLocalAnswer(option);
                }}
                className={`w-full text-left px-4 py-3 rounded-sm border text-sm transition-all ${
                  localAnswer === option
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border bg-background text-foreground hover:border-muted-foreground/30"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full resize-none rounded-sm border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {canGoPrevious && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const prevIdx = currentQuestionIndex - 1;
                  previousQuestion();
                  setLocalAnswer(prevIdx >= 0 ? (questions[prevIdx]?.answer ?? "") : "");
                }}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isFetching}
              className="gap-1 text-xs text-muted-foreground"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </Button>
            <Button
              size="sm"
              onClick={handleAnswer}
              disabled={!localAnswer.trim() || isFetching}
              className="gap-1 text-xs"
            >
              {canGoNext ? "Next" : isFetching ? "Finding directions..." : "See Directions"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {answeredQuestions.length > 0 && (
        <div className="space-y-2">
          <p className="label-sm text-muted-foreground">
            Your answers so far
          </p>
          <div className="space-y-1.5">
            {answeredQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-primary mt-0.5 shrink-0">→</span>
                <div>
                  <span className="text-foreground font-medium">{q.question}</span>
                  <span className="ml-1.5 text-muted-foreground">{q.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <HybridChatInput onSend={handleChatSend} />
      </div>
    </div>
  );
}
