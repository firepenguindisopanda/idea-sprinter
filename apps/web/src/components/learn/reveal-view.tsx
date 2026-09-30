"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { Reveal } from "@/types/learning";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";

/**
 * The answers, after the learner asked for them: the decision the exercise
 * forces, every check with what passes it and how the latest draft was judged,
 * the key's strong answer, and the full reference design.
 */
export function RevealView({ reveal }: Readonly<{ reveal: Reveal }>) {
  const checks = [...reveal.checks].sort((a, b) => Number(Boolean(b.core)) - Number(Boolean(a.core)));
  return (
    <section aria-label="Answers" className="space-y-4">
      <div className="rounded-md border border-primary/40 p-4">
        <p className="label-lg text-xs text-muted-foreground">The decision this exercise forces</p>
        <p className="mt-1">{reveal.tension}</p>
      </div>
      <Tabs defaultValue="checks">
        <TabsList>
          <TabsTrigger value="checks">Your draft, check by check</TabsTrigger>
          <TabsTrigger value="strong">Strong answer</TabsTrigger>
          <TabsTrigger value="reference">Reference design</TabsTrigger>
        </TabsList>
        <TabsContent value="checks" className="space-y-3 pt-2">
          {checks.map((check) => (
            <article key={check.id} data-testid={`reveal-${check.id}`} className="rounded-md border p-3 space-y-2">
              <p className="flex items-start gap-2 text-sm font-medium">
                {check.result.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-label="Passed" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-label="Not passed" />
                )}
                <span>
                  {check.check}
                  {check.core && <Badge variant="outline" className="ml-2 align-middle">core</Badge>}
                </span>
              </p>
              <dl className="grid gap-1 text-sm sm:grid-cols-[8rem_1fr]">
                <dt className="text-muted-foreground">Passes if</dt>
                <dd>{check.pass_if}</dd>
                {check.fail_if && (
                  <>
                    <dt className="text-muted-foreground">Fails if</dt>
                    <dd>{check.fail_if}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Why it matters</dt>
                <dd>{check.why}</dd>
                <dt className="text-muted-foreground">Your draft</dt>
                <dd>
                  {check.result.reason}
                  {check.result.quote && (
                    <blockquote className="mt-1 border-l-2 pl-2 text-muted-foreground">
                      {check.result.quote}
                      {check.result.unverified && " (not found in your draft, so not counted)"}
                    </blockquote>
                  )}
                </dd>
              </dl>
            </article>
          ))}
        </TabsContent>
        <TabsContent value="strong" className="pt-2">
          <Markdown>{reveal.strong_answer}</Markdown>
        </TabsContent>
        <TabsContent value="reference" className="pt-2">
          <Markdown>{reveal.reference_design}</Markdown>
        </TabsContent>
      </Tabs>
    </section>
  );
}
