"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { api, type WorkspaceStreamEvent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { DesignSummary, designStageLabel } from "@/components/workspace/design-status";
import type { DesignResult } from "@/types/workspace";

interface Section {
  id: string;
  title: string;
  content: string;
}

type Phase = "idle" | "running" | "done";

/**
 * A design generated for the exercise, after the learner has drafted their own
 * and revealed the answers (revamp E2). It is something to critique: written
 * by the model from the same decision the learner just studied, checked
 * against its plan and graded against the key - provisionally - and shown
 * beside the reference design. Learning mode offers it only on a revealed
 * attempt, and the server refuses it on any other (E1).
 */
export function GeneratedDesign({
  attemptId,
  referenceDesign,
}: Readonly<{ attemptId: string; referenceDesign: string }>) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState<{ stage: string; round: number } | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [design, setDesign] = useState<DesignResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useRef<{ id: string | null; abort: AbortController } | null>(null);

  // Leaving the page while it is written must not leave it spending.
  useEffect(
    () => () => {
      const current = run.current;
      if (!current) return;
      current.abort.abort();
      if (current.id) void api.cancelRun(current.id).catch(() => undefined);
    },
    [],
  );

  const onEvent = (event: WorkspaceStreamEvent) => {
    switch (event.type) {
      case "run_started":
        if (run.current && event.run_id) run.current.id = event.run_id;
        break;
      case "stage":
        if (event.stage) setStage({ stage: event.stage, round: event.round ?? 1 });
        // A writer round starts the document over: what was shown before is void.
        if (event.stage === "writer") setSections([]);
        break;
      case "section_start":
        setSections((all) => [
          ...all.filter((s) => s.id !== event.section_id),
          { id: event.section_id!, title: event.title ?? "", content: "" },
        ]);
        break;
      case "chunk":
        setSections((all) =>
          all.map((s) => (s.id === event.section_id ? { ...s, content: s.content + (event.content ?? "") } : s)),
        );
        break;
      case "section_complete":
        setSections((all) =>
          all.map((s) => (s.id === event.section_id ? { ...s, content: event.content ?? s.content } : s)),
        );
        break;
      case "error":
        setError(event.message ?? event.content ?? "The design could not be generated.");
        break;
      case "pipeline_complete":
        if (event.design) setDesign(event.design);
        setPhase("done");
        break;
    }
  };

  const generate = async () => {
    setPhase("running");
    setError(null);
    setStage(null);
    setSections([]);
    setDesign(null);
    const abort = new AbortController();
    run.current = { id: null, abort };
    try {
      await api.streamLearningDesign(attemptId, onEvent, abort.signal);
      setPhase((p) => (p === "running" ? "done" : p));
    } catch (e) {
      if (abort.signal.aborted) return;
      setError(`The design could not be generated: ${e instanceof Error ? e.message : String(e)}`);
      setPhase("idle");
    } finally {
      run.current = null;
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-label="Generated design" className="min-w-0 space-y-3">
        {phase === "idle" && (
          <div className="space-y-2 rounded-md border p-4">
            <p className="text-sm">
              Generate a design for this exercise from its brief, to critique beside the reference: it is
              checked against its own plan and graded against the answer key, provisionally.
            </p>
            <Button onClick={generate} className="gap-2">
              <Sparkles className="h-4 w-4" /> Generate a design
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {phase === "running" && stage && (
          <p className="label-xs flex items-center gap-2 text-primary">
            <span className="pulse-rule inline-block h-2 w-2 bg-primary" />
            {designStageLabel(stage.stage, stage.round)}
          </p>
        )}
        {design && <DesignSummary design={design} />}
        {sections.map((s) => (
          <article key={s.id} className="space-y-1">
            <h3 className="text-sm font-medium">{s.title}</h3>
            <Markdown>{s.content}</Markdown>
          </article>
        ))}
      </section>
      <section aria-label="Reference design" className="min-w-0 overflow-x-auto">
        <Markdown>{referenceDesign}</Markdown>
      </section>
    </div>
  );
}
