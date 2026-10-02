"use client";

import { useWorkspace } from "@/hooks/use-workspace";
import { TopBar } from "@/components/workspace/top-bar";
import { IdeaInput } from "@/components/workspace/idea-input";
import { ClarifyingQuestions } from "@/components/workspace/clarifying-questions";
import { DirectionSelector } from "@/components/workspace/direction-selector";
import { ProgressiveDoc } from "@/components/workspace/progressive-doc";
import { RunReport } from "@/components/workspace/design-status";
import { WorkspaceChatFeed } from "@/components/workspace/workspace-chat-feed";
import ProtectedRoute from "@/components/protected-route";
import { StatusBanner } from "@/components/workspace/status-banner";

export default function WorkspacePage() {
  const { phase, error, errorTone, clearError } = useWorkspace();

  // The flagship flow was the one page in the app not behind this guard, so an
  // anonymous visitor could start a 12-agent run. Now that the workspace routes
  // require a caller, an unguarded page would just 401 on the first action -
  // sending them to sign in first is both the boundary and the better flow, and
  // the landing CTA already routes signed-out users through login.
  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />

        {error && <StatusBanner message={error} tone={errorTone} onDismiss={clearError} />}

        {/* DESIGN.md's two-column workshop: a fixed discovery pane and a fluid
            specification stream. The console is opaque and sunken so the
            blueprint sheet reads only behind the document being drafted. */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] overflow-hidden">
          {/* Left Column: Discovery console */}
          <div className="bg-surface-sunken border-b lg:border-b-0 lg:border-r border-primary/20 overflow-y-auto p-5 space-y-5">
            <IdeaInput />
            {phase === "evaluating" && <WorkspaceChatFeed />}
            {phase === "clarifying_questions" && (
              <>
                <WorkspaceChatFeed />
                <ClarifyingQuestions />
              </>
            )}
            {phase === "direction_selection" && <DirectionSelector />}
            {/* Once generation starts this column is otherwise empty, and it is
              where the review belongs: alongside the document it attacks. The
              panel renders nothing until the first verdict arrives. A design
              run reports its checks here instead. */}
            {(phase === "generating" ||
              phase === "interrupted" ||
              phase === "refinement") && <RunReport />}
          </div>

          {/* Right Column: the specification stream */}
          <div className="overflow-y-auto">
            <ProgressiveDoc />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
