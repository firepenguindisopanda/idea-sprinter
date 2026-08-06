"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type {
  ArchitectureDecisionDraft,
  ArchitectureDecisionRecord,
  DecisionConsequence,
} from "@/types";
import {
  FileText,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

interface Props {
  sessionId: string;
  optionId?: string;
  optionName?: string;
}

const KIND_LABEL: Record<DecisionConsequence["kind"], string> = {
  accepted_cost: "Accepted cost",
  benefit: "Benefit",
  risk: "Risk",
};

const KIND_STYLE: Record<DecisionConsequence["kind"], string> = {
  accepted_cost: "border-warning/40 bg-warning/5 text-warning",
  benefit: "border-tertiary/30 bg-tertiary/5 text-tertiary",
  risk: "border-destructive/30 bg-destructive/5 text-destructive",
};

const KINDS: DecisionConsequence["kind"][] = ["accepted_cost", "benefit", "risk"];

/**
 * Capture the decision the user actually made.
 *
 * The model drafts, but nothing is stored until the user has been through it.
 * That gate is the whole point of this step: a record generated and filed
 * without the user reading it would document the recommender's opinion and
 * attribute it to them, which is worse than no record at all.
 */
export default function DecisionRecord({ sessionId, optionId, optionName }: Readonly<Props>) {
  const [draft, setDraft] = useState<ArchitectureDecisionDraft | null>(null);
  const [pristine, setPristine] = useState<ArchitectureDecisionDraft | null>(null);
  const [saved, setSaved] = useState<ArchitectureDecisionRecord | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // An already-captured record loads straight into the read view.
  useEffect(() => {
    let cancelled = false;
    api
      .getDecision(sessionId)
      .then((record) => {
        if (!cancelled && record) setSaved(record);
      })
      .catch(() => {
        /* No record yet is the normal case, not an error worth surfacing. */
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Comparing against the untouched draft, rather than tracking a dirty flag on
  // each keystroke, means typing a change and undoing it correctly counts as
  // unedited.
  const hasEdited = useMemo(
    () => (draft && pristine ? JSON.stringify(draft) !== JSON.stringify(pristine) : false),
    [draft, pristine],
  );
  const canSave = Boolean(draft) && (hasEdited || acknowledged);

  const requestDraft = useCallback(async () => {
    if (!optionId) return;
    setIsDrafting(true);
    setError(null);
    try {
      const proposal = await api.draftDecision(sessionId, optionId);
      setDraft(proposal);
      setPristine(structuredClone(proposal));
      setAcknowledged(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft the record");
    } finally {
      setIsDrafting(false);
    }
  }, [sessionId, optionId]);

  const save = async () => {
    if (!draft || !optionId) return;
    setIsSaving(true);
    setError(null);
    try {
      setSaved(
        await api.saveDecision(sessionId, {
          ...draft,
          option_id: optionId,
          edited_by_user: hasEdited,
        }),
      );
      setDraft(null);
      setPristine(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the record");
    } finally {
      setIsSaving(false);
    }
  };

  const patch = (changes: Partial<ArchitectureDecisionDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...changes } : prev));

  const patchConsequence = (index: number, changes: Partial<DecisionConsequence>) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            consequences: prev.consequences.map((c, i) =>
              i === index ? { ...c, ...changes } : c,
            ),
          }
        : prev,
    );

  // Nothing selected yet
  if (!optionId) {
    return (
      <Card className="border-primary/10">
        <CardContent className="py-10 text-center space-y-2">
          <IconTile className="mx-auto"><FileText /></IconTile>
          <p className="text-sm text-muted-foreground">
            Choose an option first. The record documents a decision you have made.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Captured
  if (saved) {
    return (
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="font-mono uppercase text-base">{saved.title}</CardTitle>
              <p className="label-xs text-primary/80">
                {saved.chosen_pattern.replace(/_/g, " ")} ·{" "}
                {new Date(saved.created_at).toLocaleDateString()} ·{" "}
                {saved.edited_by_user ? "edited by you" : "accepted as drafted"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaved(null);
                void requestDraft();
              }}
              className="label-xs shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Redraft
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <Section title="Context">
            <p className="text-muted-foreground leading-relaxed">{saved.context}</p>
          </Section>

          <Section title="Decision">
            <p className="leading-relaxed">{saved.decision}</p>
          </Section>

          {saved.alternatives.length > 0 && (
            <Section title="Alternatives rejected">
              <ul className="space-y-2">
                {saved.alternatives.map((alt) => (
                  <li key={alt.name} className="text-xs">
                    <span className="label-xs text-primary/80">
                      {alt.name}
                    </span>
                    <p className="text-muted-foreground mt-0.5">{alt.rejected_because}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {saved.consequences.length > 0 && (
            <Section title="Consequences">
              <ul className="space-y-2">
                {saved.consequences.map((c, i) => (
                  <li key={i} className={`border p-2 text-xs ${KIND_STYLE[c.kind]}`}>
                    <span className="label-xs">{KIND_LABEL[c.kind]}</span>
                    <p className="text-foreground/80 mt-0.5">{c.consequence}</p>
                    {c.mitigation && (
                      <p className="text-muted-foreground mt-1">
                        <span className="label-xs">Mitigation: </span>
                        {c.mitigation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {saved.contested.length > 0 && <ContestedTrail points={saved.contested} />}
        </CardContent>
      </Card>
    );
  }

  // No draft requested yet
  if (!draft) {
    return (
      <Card className="border-primary/10">
        <CardContent className="py-10 text-center space-y-4">
          <IconTile className="mx-auto"><FileText /></IconTile>
          <div className="space-y-1">
            <p className="text-sm">
              Record why you chose {optionName ? <strong>{optionName}</strong> : "this option"}.
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Drafted from this session - the requirements, the options you rejected, and
              anywhere you pushed back. You edit it before anything is saved.
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={requestDraft}
            disabled={isDrafting}
            className="label-xs"
          >
            {isDrafting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Drafting…
              </>
            ) : (
              "Draft the record"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Review and edit
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3 space-y-2">
        <CardTitle className="font-mono uppercase text-base">Decision record</CardTitle>
        <p className="text-xs text-muted-foreground">
          Drafted from your session. Read it and correct anything that is not how you would
          put it - this is your record, not the model&apos;s.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <Field label="Title">
          <Input
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="font-mono text-sm"
          />
        </Field>

        <Field label="Context" hint="The forces that made this a real decision.">
          <Textarea
            value={draft.context}
            onChange={(e) => patch({ context: e.target.value })}
            rows={4}
            className="text-sm resize-y"
          />
        </Field>

        <Field label="Decision" hint="What you chose, and the main reason.">
          <Textarea
            value={draft.decision}
            onChange={(e) => patch({ decision: e.target.value })}
            rows={3}
            className="text-sm resize-y"
          />
        </Field>

        {draft.alternatives.length > 0 && (
          <Field label="Alternatives rejected">
            <div className="space-y-3">
              {draft.alternatives.map((alt, i) => (
                <div key={alt.name} className="space-y-1">
                  <span className="label-xs text-primary/80">
                    {alt.name}
                  </span>
                  <Textarea
                    value={alt.rejected_because}
                    onChange={(e) =>
                      patch({
                        alternatives: draft.alternatives.map((a, j) =>
                          j === i ? { ...a, rejected_because: e.target.value } : a,
                        ),
                      })
                    }
                    rows={2}
                    className="text-xs resize-y"
                  />
                </div>
              ))}
            </div>
          </Field>
        )}

        <Field label="Consequences" hint="What this project now lives with.">
          <div className="space-y-3">
            {draft.consequences.map((c, i) => (
              <div key={i} className="border border-primary/15 p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    {KINDS.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => patchConsequence(i, { kind })}
                        className={`label-xs px-1.5 py-0.5 border transition-colors ${
                          c.kind === kind
                            ? KIND_STYLE[kind]
                            : "border-primary/15 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {KIND_LABEL[kind]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove consequence"
                    onClick={() =>
                      patch({ consequences: draft.consequences.filter((_, j) => j !== i) })
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <Textarea
                  value={c.consequence}
                  onChange={(e) => patchConsequence(i, { consequence: e.target.value })}
                  rows={2}
                  className="text-xs resize-y"
                />
                <Input
                  value={c.mitigation ?? ""}
                  onChange={(e) => patchConsequence(i, { mitigation: e.target.value || null })}
                  placeholder="Mitigation (optional)"
                  className="text-xs h-8"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patch({
                  consequences: [
                    ...draft.consequences,
                    { consequence: "", kind: "accepted_cost", mitigation: null },
                  ],
                })
              }
              className="label-xs h-7"
            >
              <Plus className="h-3 w-3 mr-1" /> Add consequence
            </Button>
          </div>
        </Field>

        {draft.contested.length > 0 && <ContestedTrail points={draft.contested} />}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* The gate. Editing satisfies it implicitly; a user who genuinely
            agrees with the draft says so rather than being made to fake a
            change. Either way they cannot file it without reading it. */}
        <div className="border-t border-primary/10 pt-4 space-y-3">
          {!hasEdited && (
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                className="mt-0.5"
              />
              <span className="text-muted-foreground">
                I have read this and it reflects my reasoning.
              </span>
            </label>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={save}
              disabled={!canSave || isSaving}
              className="label-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3 w-3 mr-1.5" /> Record this decision
                </>
              )}
            </Button>
            {!canSave && (
              <span className="label-xs flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3 w-3" /> Edit or confirm first
              </span>
            )}
            {hasEdited && (
              <span className="label-xs text-primary/80">
                Your edits will be recorded
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <span className="label-xs text-primary/80">{title}</span>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="label-xs text-primary/80">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/**
 * The contest exchanges, shown but not editable. They are a record of what was
 * actually said - the user can disown the conclusion by editing the decision
 * above, but not rewrite the argument that got them there.
 */
function ContestedTrail({
  points,
}: Readonly<{ points: ArchitectureDecisionDraft["contested"] }>) {
  return (
    <div className="space-y-1.5">
      <span className="label-xs text-primary/80">
        Where you pushed back
      </span>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="bg-primary/[0.02] p-2 text-xs space-y-1">
            <p className="text-muted-foreground line-through decoration-destructive/40">
              {p.assumption}
            </p>
            <p className="text-foreground/90">You said: {p.correction}</p>
            <p
              className={`label-xs ${
                p.verdict === "defended" ? "text-primary" : "text-warning"
              }`}
            >
              {p.verdict === "defended" ? "Recommendation defended" : "Recommendation revised"}
            </p>
            <p className="text-muted-foreground">{p.impact}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
