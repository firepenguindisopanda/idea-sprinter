"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, RotateCcw, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { DRAFT_OUTLINE, useLearnDraftStore } from "@/lib/learn-draft-store";
import type { Grading, LearningAttempt, Reveal } from "@/types/learning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GradingResult } from "./grading-result";
import { RevealView } from "./reveal-view";

const MIN_DRAFT = 200;
const MAX_DRAFT = 30_000;

function message(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

/**
 * One exercise: write a design, have it graded against the exercise's key, read
 * the hints, revise, and - when ready - reveal the answers and the reference
 * design. Revealing closes the attempt; the learner can then start a new one.
 */
export function ExerciseWorkspace({ exerciseId }: Readonly<{ exerciseId: string }>) {
  const storedDraft = useLearnDraftStore((s) => s.drafts[exerciseId]);
  const setDraft = useLearnDraftStore((s) => s.setDraft);
  const [attempt, setAttempt] = useState<LearningAttempt | null>(null);
  const [grading, setGrading] = useState<Grading | null>(null);
  const [gradingsLeft, setGradingsLeft] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [busy, setBusy] = useState<"loading" | "grading" | "revealing" | null>("loading");
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `last_draft` is "" until something was graded, so `||`, not `??`.
  const draft = storedDraft ?? (attempt?.last_draft || DRAFT_OUTLINE);
  const length = draft.trim().length;

  const load = useCallback(async (fresh = false) => {
    setBusy("loading");
    setError(null);
    try {
      const started = await api.startLearningAttempt(exerciseId, fresh);
      setAttempt(started);
      setGrading(started.gradings.at(-1) ?? null);
      setGradingsLeft(started.gradings_left);
      setReveal(started.reveal);
      setConfirmReveal(false);
    } catch (e) {
      setError(message(e, "Could not open this exercise."));
    } finally {
      setBusy(null);
    }
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  const grade = async () => {
    if (!attempt) return;
    setBusy("grading");
    setError(null);
    try {
      const result = await api.gradeLearningDraft(attempt.attempt_id, draft);
      setGrading(result);
      setGradingsLeft(result.gradings_left ?? 0);
    } catch (e) {
      setError(message(e, "The grading failed. Your draft is kept; try again."));
    } finally {
      setBusy(null);
    }
  };

  const doReveal = async () => {
    if (!attempt) return;
    setBusy("revealing");
    setError(null);
    try {
      setReveal(await api.revealLearningAttempt(attempt.attempt_id));
      setGradingsLeft(0);
    } catch (e) {
      setError(message(e, "Could not reveal the answers."));
    } finally {
      setBusy(null);
      setConfirmReveal(false);
    }
  };

  if (!attempt) {
    return busy === "loading" ? (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening the exercise
      </p>
    ) : (
      <p role="alert" className="text-sm text-destructive">{error}</p>
    );
  }

  const { exercise } = attempt;
  const canGrade = !reveal && gradingsLeft > 0 && length >= MIN_DRAFT && length <= MAX_DRAFT && busy === null;

  const header = (
    <header className="space-y-2">
      <h1 className="text-3xl font-bold tracking-[-0.03em]">{exercise.exercise}</h1>
      <p>{exercise.premise}</p>
      <p>
        <span className="font-medium">Twist: </span>
        {exercise.twist}
      </p>
      <p className="text-sm text-muted-foreground">
        Design it: requirements, the numbers, the decision the twist forces and what it costs,
        the architecture, APIs, data, failure modes and tests. Your draft is graded against a
        key of 13 checks; you get hints, not answers, until you reveal.
      </p>
    </header>
  );

  const editor = (
    <>
      <label htmlFor="learn-draft" className="sr-only">Your design</label>
      <Textarea
        id="learn-draft"
        value={draft}
        onChange={(e) => setDraft(exerciseId, e.target.value)}
        readOnly={Boolean(reveal)}
        className="min-h-[28rem] font-mono text-sm"
      />
    </>
  );

  const controls = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={grade} disabled={!canGrade}>
          {busy === "grading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {grading ? "Grade again" : "Grade my draft"}
        </Button>
        {!reveal && (
          confirmReveal ? (
            <>
              <Button variant="destructive" onClick={doReveal} disabled={busy !== null}>
                <Eye className="h-4 w-4" /> Yes, show the answers
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReveal(false)}>Keep working</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmReveal(true)} disabled={!grading || busy !== null}>
              <Eye className="h-4 w-4" /> Reveal answers
            </Button>
          )
        )}
        {reveal && (
          <Button variant="outline" onClick={() => load(true)} disabled={busy !== null}>
            <RotateCcw className="h-4 w-4" /> Start a new attempt
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {length < MIN_DRAFT
          ? `Write at least ${MIN_DRAFT} characters (${length} so far).`
          : length > MAX_DRAFT
            ? `Keep it under ${MAX_DRAFT} characters (${length}).`
            : `${length} characters.`}{" "}
        {!reveal && `${gradingsLeft} grading${gradingsLeft === 1 ? "" : "s"} left.`}
        {confirmReveal && " Revealing ends this attempt: no more gradings on it."}
      </p>
      {busy === "grading" && (
        <p role="status" className="text-sm text-muted-foreground">
          Grading against the key - usually about a minute.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </>
  );

  // Once revealed, the draft is read-only and the answers are what is read:
  // they take the full width (the generated design sits beside the reference
  // inside them), and the draft folds away above them.
  if (reveal) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="max-w-4xl space-y-4">
          {header}
          <details className="group rounded-md border">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
              Your draft
              <span className="ml-2 font-normal text-muted-foreground">read-only; open it to compare</span>
            </summary>
            <div className="border-t p-3">{editor}</div>
          </details>
          {controls}
        </div>
        <RevealView reveal={reveal} />
      </div>
    );
  }

  return (
    // grid-cols-1 is minmax(0, 1fr): without it the column takes the widest
    // table in the reference design, and the app shell's grid follows it.
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4 min-w-0">
        {header}
        {editor}
        {controls}
      </div>
      <div className="min-w-0">
        {grading ? (
          <GradingResult grading={grading} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Your grading appears here: each check you pass, and a hint for each one you miss.
          </p>
        )}
      </div>
    </div>
  );
}
