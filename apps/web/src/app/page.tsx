"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { rememberIntendedRoute } from "@/lib/post-login-redirect";
import { PersonaSelector } from "@/components/persona/persona-selector";
import { ArrowRight, User } from "lucide-react";
import DraftBanner from "@/components/landing/draft-banner";

/**
 * The four stages a run actually moves through, in order - the same sequence
 * the workspace top bar labels while you work. Numbering these is honest;
 * numbering the old three feature tiles was not, because nothing about
 * "Agent Swarm" comes before "System Specs".
 */
const STAGES = [
  {
    n: "01",
    name: "Draft",
    detail: "Describe the idea in a sentence. It gets scored for vagueness before anything is generated.",
  },
  {
    n: "02",
    name: "Discovery",
    detail: "Answer only the questions your description left open. Clear ideas skip straight past this.",
  },
  {
    n: "03",
    name: "Direction",
    detail: "Pick which version of the system to build. The choice is recorded and every agent works to it.",
  },
  {
    n: "04",
    name: "Spec",
    detail: "Twelve agents draft in parallel, a judge reviews each section, and contradictions surface as they appear.",
  },
];

/** What the title block on a drawing states: subject, method, output. */
const TITLE_BLOCK = [
  { field: "Subject", value: "One sentence describing what you want built" },
  { field: "Method", value: "Clarify, choose a direction, then 12 agents draft" },
  { field: "Output", value: "PRD, data model, API surface, QA and DevOps plans" },
];

export default function Home() {
  const { user } = useAuthStore();
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  return (
    <div className="relative flex flex-col min-h-full">
      <DraftBanner />

      <div className="sheet-frame mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-8 lg:py-20">
        {/* Sheet header - the strip across the top of a drawing. */}
        <div className="flex items-center justify-between gap-4 border-b border-primary/25 pb-3">
          <span className="label-xs text-primary">Workshop Studio</span>
          <span className="label-xs text-muted-foreground">Rev 2.0.0</span>
        </div>

        <div className="grid gap-12 pt-12 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:pt-16">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              Vague idea in.
              <br />
              <span className="text-primary">Drafted spec</span> out.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Describe what you want to build. The workshop tells you where the
              description is too vague to act on, asks only about those parts,
              then drafts the specification you would otherwise write by hand.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* This link goes straight to login rather than through a
                  protected route, so it has to record the intent itself -
                  otherwise signing in lands on the dashboard and the user has to
                  ask for the workshop a second time. */}
              <Link
                href={{ pathname: user ? "/workspace" : "/auth/login" }}
                onClick={() => {
                  if (!user) rememberIntendedRoute("/workspace");
                }}
              >
                <Button size="xl" className="w-full gap-3 sm:w-auto">
                  Start a draft
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              {!user && (
                <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                  <Link
                    href="https://github.com/firepenguindisopanda/idea-sprinter"
                    target="_blank"
                  >
                    Read the source
                  </Link>
                </Button>
              )}
            </div>

            {user && !showPersonaSelector && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPersonaSelector(true)}
                className="label-xs h-auto px-0 text-muted-foreground hover:bg-transparent hover:text-primary"
              >
                <User className="mr-2 h-3 w-3" />
                Role: {user.persona || "not set"}
              </Button>
            )}
          </div>

          {/* Title block. Every drawing carries one; this states what goes in,
              what runs, and what comes back out. */}
          <div className="reticle self-start border border-primary/25 bg-card/70 backdrop-blur-sm">
            <div className="border-b border-primary/20 px-5 py-3">
              <span className="label-xs text-primary">Title block</span>
            </div>
            <dl className="divide-y divide-primary/12">
              {TITLE_BLOCK.map(({ field, value }) => (
                <div key={field} className="px-5 py-4">
                  <dt className="label-xs mb-2 text-muted-foreground">{field}</dt>
                  <dd className="text-sm leading-relaxed text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {showPersonaSelector && user && (
          <div className="mt-12 border border-primary/25 bg-card/70 p-6 backdrop-blur-sm">
            <div className="label-xs mb-4 text-primary">Select your role</div>
            <PersonaSelector
              currentPersona={user.persona}
              onSelect={() => setShowPersonaSelector(false)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPersonaSelector(false)}
              className="label-xs mt-4"
            >
              Close
            </Button>
          </div>
        )}

        {/* The run, stage by stage. */}
        <div className="mt-16 lg:mt-24">
          <div className="flex items-center gap-4 border-b border-primary/25 pb-3">
            <span className="label-xs text-primary">The run</span>
            <div className="h-px flex-1 bg-primary/15" />
            <span className="label-xs text-muted-foreground">4 stages</span>
          </div>

          <ol className="grid grid-cols-1 divide-y divide-primary/15 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
            {STAGES.map(({ n, name, detail }) => (
              <li
                key={n}
                className="group p-6 transition-colors hover:bg-primary/5"
              >
                <div className="label-xs mb-4 text-primary/80 transition-colors group-hover:text-primary">
                  {n}
                </div>
                <h2 className="label-lg mb-2 text-base">
                  {name}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
