"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ContestOutcome } from "@/types";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";

interface Props {
  sessionId: string;
  optionId: string;
  assumption: string;
}

/**
 * One assumption the user can argue with.
 *
 * This is where the studio stops being a recommender that talks at you. The
 * model states what it assumed; you say it is wrong and why; it has to either
 * revise the recommendation or defend it against your correction. Both answers
 * teach something - the defence more than the revision, usually.
 */
export default function ContestableAssumption({ sessionId, optionId, assumption }: Readonly<Props>) {
  const [isOpen, setIsOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [outcome, setOutcome] = useState<ContestOutcome | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!correction.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      setOutcome(await api.contestAssumption(sessionId, optionId, assumption, correction.trim()));
      setIsOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reassess");
    } finally {
      setIsLoading(false);
    }
  };

  const defended = outcome?.verdict === "defended";

  return (
    <li className="text-xs space-y-2">
      <div className="flex gap-2 items-start">
        <span aria-hidden className="text-warning mt-0.5">?</span>
        <span className="text-muted-foreground flex-1">{assumption}</span>
        {!outcome && !isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="label-xs shrink-0 text-primary/80 hover:text-primary underline underline-offset-2"
          >
            That&apos;s wrong
          </button>
        )}
      </div>

      {isOpen && (
        <div className="ml-5 space-y-2">
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="What's actually true? e.g. 'all 5000 users hit it in the same 20 minutes each morning'"
            rows={2}
            className="w-full p-2 text-xs border border-primary/20 bg-background focus:border-primary focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={submit}
              disabled={isLoading || !correction.trim()}
              className="label-xs h-7"
            >
              {isLoading ? (
                <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Reassessing…</>
              ) : (
                "Make it reassess"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsOpen(false); setCorrection(""); }}
              className="label-xs h-7 text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="ml-5 text-destructive">{error}</p>}

      {outcome && (
        <div
          className={`ml-5 border p-2.5 space-y-1.5 ${
            defended
              ? "border-primary/25 bg-primary/5"
              : "border-warning/40 bg-warning/5"
          }`}
        >
          <div className="label-xs flex items-center gap-2">
            {defended ? (
              <><ShieldCheck className="h-3 w-3 text-primary" /><span className="text-primary">Recommendation defended</span></>
            ) : (
              <><RefreshCw className="h-3 w-3 text-warning" /><span className="text-warning">Recommendation revised</span></>
            )}
            {outcome.assumption_was_wrong && (
              <span className="text-muted-foreground normal-case">- your correction was accepted</span>
            )}
          </div>

          <p className="text-foreground/90 leading-relaxed">{outcome.impact}</p>

          {outcome.revised_assumption && (
            <p className="text-muted-foreground">
              <span className="label-xs">Now assumes: </span>
              {outcome.revised_assumption}
            </p>
          )}

          {outcome.affected_dimensions.length > 0 && (
            <p className="text-muted-foreground">
              <span className="label-xs">Affects: </span>
              {outcome.affected_dimensions.join(", ").replace(/_/g, " ")}
            </p>
          )}

          {outcome.follow_up_question && (
            <p className="text-primary/80 ">{outcome.follow_up_question}</p>
          )}

          {!outcome.still_recommended && (
            <p className="label-xs text-destructive">
              No longer a recommended choice
            </p>
          )}
        </div>
      )}
    </li>
  );
}
