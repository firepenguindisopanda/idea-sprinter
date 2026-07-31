"use client";

import { Suspense, useState, useEffect } from "react";
import ProtectedRoute from "@/components/protected-route";
import ArchitectureChat from "@/components/architecture/architecture-chat";
import ArchitectureOptions from "@/components/architecture/architecture-options";
import DecisionRecord from "@/components/architecture/decision-record";
import ArchitectureComparisonView from "@/components/architecture/comparison-matrix";
import ImportPatternModal from "@/components/architecture/import-pattern-modal";
import ExampleLibrary from "@/components/examples/example-library";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useSSE } from "@/hooks/useSSE";
import type { ArchitectureSession } from "@/types";
import {
  requirementsForSession,
  titleForSession,
  type SystemDesignExample,
} from "@/lib/system-design-examples";
import { Button } from "@/components/ui/button";
import { Sparkles, Scale, CheckCircle2, Library, Lock } from "lucide-react";

type ViewId = "chat" | "options" | "compare" | "decision";

/**
 * The four views are a sequence, not a set: you cannot compare options you have
 * not generated, or record a decision you have not made. Numbering them is
 * therefore carrying real information rather than decorating the tab bar, and
 * the lock state tells you what the session still owes you.
 */
const VIEWS: { id: ViewId; label: string; step: string }[] = [
  { id: "chat", label: "Brief", step: "01" },
  { id: "options", label: "Options", step: "02" },
  { id: "compare", label: "Compare", step: "03" },
  { id: "decision", label: "Decision", step: "04" },
];

function ArchitecturePageContent() {
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const [session, setSession] = useState<ArchitectureSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>("chat");
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [startMode, setStartMode] = useState<"starter" | "describe">("starter");
  const [pickedStarter, setPickedStarter] = useState<SystemDesignExample | null>(null);

  const sse = useSSE<{ type: string }>({
    onEvent: async (event) => {
      if (event.type === 'option' && session) {
        await loadSession(session.id);
      }
    },
    // Surface the failure instead of burying it in the console - this endpoint
    // silently 401'd for every user because the request carried no auth header.
    onError: (err) => setGenerateError(err.message || 'Failed to generate options'),
  });
  const isGenerating = sse.isStreaming;

  // Form state for new session
  const [projectName, setProjectName] = useState("");
  const [requirements, setRequirements] = useState("");
  const [constraints, setConstraints] = useState("");

  // Load existing session from URL if present
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    try {
      const data = await api.getArchitectureSession(id);
      setSession(data);
      if (data.options.length > 0) {
        setActiveView('options');
      }
      if (data.comparison) {
        setActiveView('compare');
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const handleCreateSession = async () => {
    if (!projectName.trim() || !requirements.trim()) return;

    setIsCreating(true);
    try {
      const newSession = await api.createArchitectureSession({
        project_name: projectName,
        requirements: requirements,
        constraints: constraints || undefined,
        persona: user?.persona ?? undefined,
      });
      setSession(newSession);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Fill the form from a starter and switch to it rather than creating the
   * session outright - the requirements are the input the whole session reasons
   * from, so they get read and edited before anything is committed.
   */
  const handlePickStarter = (example: SystemDesignExample) => {
    setPickedStarter(example);
    setProjectName(titleForSession(example));
    setRequirements(requirementsForSession(example));
    setConstraints(example.constraints);
    setStartMode("describe");
  };

  const handleGenerate = async () => {
    if (!session) return;
    setActiveView('options');
    setGenerateError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    // This endpoint requires auth (architecture.py: Depends(get_current_user)).
    await sse.startStream(
      `${apiUrl}/architecture/sessions/${session.id}/generate`,
      { num_options: 3 },
      token ? { Authorization: `Bearer ${token}` } : undefined,
    );
    if (session) await loadSession(session.id);
  };

  const handleCompare = async () => {
    if (!session) return;

    setIsComparing(true);
    try {
      const comparison = await api.compareArchitectureOptions(session.id);
      setSession(prev => prev ? { ...prev, comparison } : null);
      setActiveView('compare');
    } catch (error) {
      console.error("Failed to compare:", error);
    } finally {
      setIsComparing(false);
    }
  };

  const handleRefined = async () => {
    if (!session) return;
    await loadSession(session.id);
  };

  const handleSelectOption = async (optionId: string) => {
    if (!session) return;

    try {
      await api.selectArchitectureOption(session.id, { option_id: optionId });
      setSession(prev => prev ? { ...prev, selected_option_id: optionId } : null);
    } catch (error) {
      console.error("Failed to select option:", error);
    }
  };

  // ── Start screen ────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <header className="border-b-2 border-primary/20 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/50">
            Architecture Studio
          </p>
          <h1 className="mt-3 font-mono text-4xl font-bold uppercase tracking-tighter md:text-5xl">
            Decide an architecture<span className="text-primary">.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Generate several viable approaches, argue with them, and record which one you
            chose and why. The point is not the diagram - it is the reasoning you can
            still defend in six months.
          </p>
        </header>

        <div className="mt-8 flex gap-1" role="tablist" aria-label="How to start">
          {([
            { id: "starter", label: "Pick a starter" },
            { id: "describe", label: "Describe your own" },
          ] as const).map((tab) => {
            const active = startMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStartMode(tab.id)}
                className={`border-b-2 px-4 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                [{tab.label}]
              </button>
            );
          })}
        </div>

        {startMode === "starter" ? (
          <section className="mt-8" aria-label="Starters">
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Thirty-one well-known systems, each with one feature the original does not
              have. Cloning Bitly has a known answer; adding link health monitoring does
              not, and that is where the design decisions live.
            </p>
            <ExampleLibrary
              className="mt-6"
              onSelect={handlePickStarter}
              actionLabel="Load into brief"
            />
          </section>
        ) : (
          <section className="mt-8 max-w-3xl" aria-label="Project brief">
            {pickedStarter && (
              <div className="mb-6 border-l-2 border-primary bg-primary/5 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary/70">
                  Loaded from starter
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-bold">{pickedStarter.name}</span>{" "}
                  <span className="text-muted-foreground">
                    - edit anything below before you start. These requirements are what
                    every option will be argued against.
                  </span>
                </p>
              </div>
            )}

            <div className="border-2 border-primary/20">
              <div className="border-b border-primary/20 bg-primary/5 px-5 py-3">
                <h2 className="font-mono text-xs uppercase tracking-widest text-primary/70">
                  New session
                </h2>
              </div>

              <div className="space-y-5 p-5">
                <div className="space-y-2">
                  <label
                    htmlFor="arch-project-name"
                    className="block font-mono text-[10px] uppercase tracking-widest text-primary/60"
                  >
                    Project name
                  </label>
                  <input
                    id="arch-project-name"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Bitly + link health monitoring"
                    className="w-full border border-primary/20 bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="arch-requirements"
                    className="block font-mono text-[10px] uppercase tracking-widest text-primary/60"
                  >
                    Requirements
                  </label>
                  <textarea
                    id="arch-requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="What the system has to do, and at what scale."
                    rows={10}
                    className="w-full resize-y border border-primary/20 bg-background p-3 font-mono text-sm leading-relaxed focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="arch-constraints"
                    className="block font-mono text-[10px] uppercase tracking-widest text-primary/60"
                  >
                    Constraints
                    <span className="ml-2 normal-case tracking-normal text-muted-foreground">
                      budget, team size, timeline
                    </span>
                  </label>
                  <textarea
                    id="arch-constraints"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="Team: 3 engineers. Timeline: 12 weeks. Budget: under $1,000/month."
                    rows={3}
                    className="w-full resize-y border border-primary/20 bg-background p-3 font-mono text-sm leading-relaxed focus:border-primary focus:outline-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Constraints do most of the work. Without them every option looks
                    equally good.
                  </p>
                </div>

                <Button
                  onClick={handleCreateSession}
                  disabled={isCreating || !projectName.trim() || !requirements.trim()}
                  className="w-full rounded-none font-mono uppercase tracking-widest"
                  size="lg"
                >
                  {isCreating ? "Starting…" : "Start session"}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  // ── Session ─────────────────────────────────────────────────────────
  const unlocked: Record<ViewId, boolean> = {
    chat: true,
    options: session.options.length > 0,
    compare: Boolean(session.comparison),
    decision: Boolean(session.selected_option_id),
  };

  const statusLine =
    session.options.length === 0
      ? "Generate options to start comparing"
      : session.selected_option_id
        ? "Decision recorded"
        : "Compare the options and choose one";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      <header className="border-b-2 border-primary/20 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/50">
              Architecture Studio
            </p>
            <h1 className="mt-2 truncate font-mono text-3xl font-bold uppercase tracking-tighter">
              {session.project_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{statusLine}</p>
          </div>

          <div className="flex shrink-0 gap-2">
            {session.options.length === 0 && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded-none font-mono text-[10px] uppercase tracking-widest"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                {isGenerating ? "Generating…" : "Generate options"}
              </Button>
            )}

            {session.options.length > 0 && !session.comparison && (
              <Button
                onClick={handleCompare}
                disabled={isComparing}
                variant="outline"
                className="rounded-none font-mono text-[10px] uppercase tracking-widest"
              >
                <Scale className="mr-2 h-3 w-3" />
                {isComparing ? "Comparing…" : "Compare options"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowPatternModal(true)}
              className="rounded-none font-mono text-[10px] uppercase tracking-widest"
            >
              <Library className="mr-2 h-3 w-3" />
              Patterns
            </Button>
          </div>
        </div>
      </header>

      {generateError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
        >
          <span className="text-destructive">{generateError}</span>
          <button
            onClick={() => setGenerateError(null)}
            className="font-mono text-xs uppercase text-destructive/70 hover:text-destructive"
          >
            Dismiss
          </button>
        </div>
      )}

      <nav className="flex flex-wrap gap-1 border-b border-primary/15" aria-label="Session stages">
        {VIEWS.map((view) => {
          const isUnlocked = unlocked[view.id];
          const active = activeView === view.id;
          const count = view.id === "options" ? session.options.length : null;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              disabled={!isUnlocked}
              aria-current={active ? "step" : undefined}
              title={isUnlocked ? undefined : "Not available yet"}
              className={`group flex items-baseline gap-2 border-b-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground enabled:hover:text-primary"
              } disabled:cursor-not-allowed disabled:text-muted-foreground/40`}
            >
              <span className={active ? "text-primary/60" : "text-muted-foreground/50"}>
                {view.step}
              </span>
              <span>{view.label}</span>
              {count !== null && count > 0 && (
                <span className="text-primary/60">({count})</span>
              )}
              {!isUnlocked && <Lock aria-hidden className="h-3 w-3" />}
            </button>
          );
        })}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeView === 'chat' && (
            <ArchitectureChat
              session={session}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onRefined={handleRefined}
            />
          )}

          {activeView === 'options' && session.options.length > 0 && (
            <ArchitectureOptions
              options={session.options}
              selectedOptionId={session.selected_option_id}
              onSelect={handleSelectOption}
              sessionId={session.id}
            />
          )}

          {activeView === 'compare' && session.comparison && (
            <ArchitectureComparisonView
              comparison={session.comparison}
              selectedOptionId={session.selected_option_id}
              onSelect={handleSelectOption}
            />
          )}

          {activeView === 'decision' && (
            <DecisionRecord
              sessionId={session.id}
              optionId={session.selected_option_id}
              optionName={
                session.options.find((o) => o.id === session.selected_option_id)?.name
              }
            />
          )}
        </div>

        <aside className="space-y-4">
          <section className="border border-primary/15">
            <h2 className="border-b border-primary/15 bg-primary/5 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-primary/60">
              Session
            </h2>
            <dl className="space-y-2.5 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-mono text-xs uppercase">{session.status}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Options</dt>
                <dd className="font-mono text-xs uppercase">{session.options.length}</dd>
              </div>
              {session.selected_option_id && (
                <div className="flex items-center gap-2 border-t border-primary/10 pt-2.5 text-primary">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-xs">Architecture selected</span>
                </div>
              )}
            </dl>
          </section>

          <section className="border border-primary/15">
            <h2 className="border-b border-primary/15 bg-primary/5 px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-primary/60">
              Requirements
            </h2>
            <div className="p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {session.requirements}
              </p>
              {session.constraints && (
                <div className="mt-3 border-t border-primary/10 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60">
                    Constraints
                  </span>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {session.constraints}
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {showPatternModal && session && (
        <ImportPatternModal
          sessionId={session.id}
          onClose={() => setShowPatternModal(false)}
          onImported={() => loadSession(session.id)}
        />
      )}
    </div>
  );
}

function ArchitecturePageLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-primary/20" />
        <div className="h-4 w-96 bg-primary/10" />
        <div className="h-64 border border-primary/10 bg-primary/5" />
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ArchitecturePageLoading />}>
        <ArchitecturePageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
