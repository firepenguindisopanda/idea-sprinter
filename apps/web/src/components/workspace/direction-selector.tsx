"use client";

import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

const MOCK_SECTIONS = [
  { id: "sec-overview", title: "Project Overview", content: "A brief overview of your project based on the direction you selected. This section covers the high-level goals, target audience, and core value proposition." },
  { id: "sec-features", title: "Core Features", content: "Key features and functionality that define the product scope." },
  { id: "sec-tech-stack", title: "Technical Stack", content: "Recommended technology choices including frontend framework, backend runtime, database, and infrastructure." },
  { id: "sec-security", title: "Security Considerations", content: "Security requirements, authentication approach, data protection measures." },
  { id: "sec-deployment", title: "Deployment Strategy", content: "Deployment pipeline, hosting infrastructure, CI/CD approach." },
];

function startMockGeneration() {
  const store = useWorkspaceStore.getState();
  let order = 0;
  const timer = setInterval(() => {
    if (order < MOCK_SECTIONS.length) {
      const section = MOCK_SECTIONS[order];
      store.updateDocSection(section.id, { status: "complete", content: section.content });
      const nextIdx = order + 1;
      if (nextIdx < MOCK_SECTIONS.length) {
        store.updateDocSection(MOCK_SECTIONS[nextIdx].id, { status: "generating" });
      }
      order++;
    } else {
      store.setPhase("refinement");
      clearInterval(timer);
    }
  }, 1500);
}

function buildBrief(): string {
  const state = useWorkspaceStore.getState();
  const parts: string[] = [state.ideaInput];
  for (const q of state.questions) {
    if (q.answer) parts.push(`- ${q.question} ${q.answer}`);
  }
  return parts.join("\n");
}

function initDocSections() {
  const store = useWorkspaceStore.getState();
  for (let i = 0; i < MOCK_SECTIONS.length; i++) {
    store.addDocSection({
      id: MOCK_SECTIONS[i].id,
      title: MOCK_SECTIONS[i].title,
      status: i === 0 ? "generating" : "pending",
      content: "",
      order: i,
    });
  }
}

export function DirectionSelector() {
  const { directions, selectDirection, phase } = useWorkspace();

  const handleSelect = async (directionId: string) => {
    selectDirection(directionId);
    initDocSections();
    const brief = buildBrief();

    try {
      // Try real SSE streaming from backend
      const response = await fetch(`${API_URL}/api/workspace/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction_id: directionId, brief }),
      });

      if (!response.ok || !response.body) throw new Error("API unavailable");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const store = useWorkspaceStore.getState();
      const sectionContents: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            switch (event.type) {
              case "section_start": {
                store.addDocSection({
                  id: event.section_id,
                  title: event.title,
                  status: "generating",
                  content: "",
                  order: event.order ?? 0,
                });
                sectionContents[event.section_id] = "";
                break;
              }
              case "chunk": {
                sectionContents[event.section_id] =
                  (sectionContents[event.section_id] ?? "") + (event.content ?? "");
                store.updateDocSection(event.section_id, {
                  content: sectionContents[event.section_id],
                });
                break;
              }
              case "section_complete": {
                store.updateDocSection(event.section_id, {
                  status: "complete",
                  content: event.content ?? sectionContents[event.section_id] ?? "",
                });
                break;
              }
              case "pipeline_complete": {
                store.setPhase("refinement");
                return;
              }
            }
          } catch {
            // Skip malformed events
          }
        }
      }
      // Stream ended without pipeline_complete — fallback
      store.setPhase("refinement");
    } catch {
      // API unavailable — fall back to mock timer
      startMockGeneration();
    }
  };

  if (directions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm text-sm text-muted-foreground text-center">
        Analyzing your answers to suggest directions...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Possible Directions
        </h2>
        <p className="text-sm text-muted-foreground">
          Based on your brief, here are some ways to approach this project.
        </p>
      </div>

      <div className="grid gap-4">
        {directions.map((dir) => (
          <button
            key={dir.id}
            onClick={() => handleSelect(dir.id)}
            className="group text-left rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {dir.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dir.description}
                </p>
                {dir.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dir.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* Custom / Hybrid option */}
      <div className="text-center">
        <Button variant="ghost" className="gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          I want something different — describe my own
        </Button>
      </div>
    </div>
  );
}
