"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { OptionChallenge } from "@/types";
import { ShieldAlert, BookOpen, Loader2, HelpCircle } from "lucide-react";
import ContestableAssumption from "./contestable-assumption";

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-destructive/40 bg-destructive/5 text-destructive",
  medium: "border-warning/40 bg-warning/5 text-warning",
  low: "border-primary/20 bg-primary/5 text-muted-foreground",
};

interface Props {
  sessionId: string;
  optionId: string;
  assumptions?: string[];
}

/**
 * The case *against* an architecture option.
 *
 * The studio recommends; this is what makes the recommendation arguable. It
 * runs the backend's existing adversarial reviewer over the option and shows
 * the attack vectors, the assumptions worth verifying, and published
 * engineering material that bears on the choice - so the user can push back
 * from evidence rather than take the recommendation on faith.
 */
export default function OptionChallenge({ sessionId, optionId, assumptions }: Readonly<Props>) {
  const [challenge, setChallenge] = useState<OptionChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setChallenge(await api.challengeArchitectureOption(sessionId, optionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build the counter-case");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-primary/10 pt-4">
      {/* Assumptions are shown before any request - they are the cheapest thing
          for a user to confirm or reject from their own knowledge. */}
      {assumptions && assumptions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-mono uppercase text-warning flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3" />
            Assumptions to check
          </span>
          <p className="text-xs text-muted-foreground">
            These are things the model filled in that you never said. Tell it
            where it is wrong and it has to defend or revise.
          </p>
          <ul className="space-y-2.5">
            {assumptions.map((a) => (
              <ContestableAssumption
                key={a}
                sessionId={sessionId}
                optionId={optionId}
                assumption={a}
              />
            ))}
          </ul>
        </div>
      )}

      {!challenge && (
        <Button
          variant="outline"
          size="sm"
          onClick={run}
          disabled={isLoading}
          className="label-xs w-full"
        >
          {isLoading ? (
            <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Building the counter-case…</>
          ) : (
            <><ShieldAlert className="h-3 w-3 mr-2" /> Challenge this option</>
          )}
        </Button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {challenge && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-destructive flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3" />
              The case against
            </span>
            <span className="label-xs text-muted-foreground">
              risk: {challenge.risk_level}
            </span>
          </div>

          {challenge.summary && (
            <p className="text-xs text-muted-foreground ">{challenge.summary}</p>
          )}

          {challenge.attack_vectors.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No specific objections were raised - treat that as weak evidence, not a green light.
            </p>
          ) : (
            <ul className="space-y-2">
              {challenge.attack_vectors.map((v) => (
                <li
                  key={v.id}
                  className={`border p-2.5 text-xs space-y-1 ${SEVERITY_STYLES[v.severity] ?? SEVERITY_STYLES.low}`}
                >
                  <div className="label-xs flex items-center gap-2">
                    <span>{v.severity}</span>
                    <span className="opacity-60">{v.category.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-foreground/90">{v.description}</p>
                  {v.suggested_fix && (
                    <p className="text-muted-foreground">
                      <span className="label-xs">Mitigation: </span>
                      {v.suggested_fix}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {challenge.counterpoint_reading.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase text-primary/80 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" />
                Worth reading against this
              </span>
              {challenge.counterpoint_reading.map((c) => (
                <details key={c.book} className="text-xs border border-primary/10 p-2">
                  <summary className="label-xs cursor-pointer text-primary/80">
                    {c.book.replace(/-/g, " ")}
                  </summary>
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{c.excerpt}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
