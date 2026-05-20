# Workshop Studio Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Workshop Studio into the primary user experience with vagueness-aware clarification, SSE streaming, and a streamlined navigation that de-emphasizes legacy pages.

**Architecture:** Incremental improvements to the existing workspace foundation — add vagueness evaluation phase, fix SSE communication, update landing page to single CTA, hide legacy nav links, add "The Relics" section to dashboard.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Zustand, Tailwind CSS v4, FastAPI (backend), SSE streaming, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/workspace.ts` | Modify | Add `VaguenessScores`, `ChatMessage` types, new phase `'evaluating'` |
| `src/lib/workspace-store.ts` | Modify | Add vagueness state, chat messages, threshold, new actions |
| `src/hooks/use-workspace.ts` | Modify | Expose new state and actions |
| `src/lib/api.ts` | Modify | Add `evaluateVagueness()` method, fix `generateDocument()` to use SSE |
| `src/components/workspace/vagueness-report.tsx` | **Create** | Render vagueness scores as bar chart card |
| `src/components/workspace/chat-message.tsx` | **Create** | Render individual chat messages (user + system) |
| `src/components/workspace/hybrid-chat-input.tsx` | **Create** | Secondary chat input below clarifying questions |
| `src/components/workspace/idea-input.tsx` | Modify | Trigger vagueness evaluation on submit |
| `src/components/workspace/clarifying-questions.tsx` | Modify | Add hybrid chat input, show chat history |
| `src/components/workspace/workspace-chat-feed.tsx` | **Create** | Container for chat messages in left panel |
| `src/app/page.tsx` | Modify | Replace 3-path grid with single "Start Workshop" CTA |
| `src/components/header.tsx` | Modify | Remove ideation/prd/generate from nav |
| `src/app/dashboard/page.tsx` | Modify | Add "The Relics" section |
| `src/app/workspace/page.tsx` | Modify | Add chat feed container, update layout |
| `src/__tests__/workspace-store.test.ts` | Modify | Add tests for new vagueness/chat state |
| `app/routers/workspace.py` (backend) | Modify | Add `/evaluate` endpoint |

---

### Task 1: Add Vagueness Types to Workspace Domain

**Files:**
- Modify: `apps/web/src/types/workspace.ts`
- Test: `apps/web/src/__tests__/workspace-store.test.ts` (updated in Task 2)

- [ ] **Step 1: Add new types to workspace.ts**

Add the vagueness evaluation types, chat message type, and the new `'evaluating'` phase to the existing file. Append these types before the closing of the file:

```typescript
// apps/web/src/types/workspace.ts — append after WorkspaceState interface

export type WorkspacePhase =
  | 'idea_input'
  | 'evaluating'
  | 'clarifying_questions'
  | 'direction_selection'
  | 'generating'
  | 'refinement';

export interface VaguenessScores {
  borderlineCase: number;
  scalarTerms: number;
  quantitativeImprecision: number;
  subjectiveModality: number;
  contextDependence: number;
  overallScore: number;
  thresholdMet: boolean;
  weakDimensions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

Also update the `WorkspacePhase` type at the top of the file (replace the existing one):

```typescript
export type WorkspacePhase =
  | 'idea_input'
  | 'evaluating'
  | 'clarifying_questions'
  | 'direction_selection'
  | 'generating'
  | 'refinement';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors (existing errors may exist, but no new ones from our changes)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/types/workspace.ts
git commit -m "types: add vagueness scores, chat message, and evaluating phase"
```

---

### Task 2: Extend Workspace Store with Vagueness & Chat State

**Files:**
- Modify: `apps/web/src/lib/workspace-store.ts`
- Test: `apps/web/src/__tests__/workspace-store.test.ts`

- [ ] **Step 1: Add new state and actions to the store**

Replace the entire `workspace-store.ts` file with the updated version that includes vagueness and chat state:

```typescript
// apps/web/src/lib/workspace-store.ts
import { create } from 'zustand';
import type {
  WorkspaceState,
  WorkspacePhase,
  ClarifyingQuestion,
  DirectionOption,
  DocSection,
  RefinementAction,
  VaguenessScores,
  ChatMessage,
} from '@/types/workspace';

interface WorkspaceActions {
  setPhase: (phase: WorkspacePhase) => void;
  setIdeaInput: (input: string) => void;
  setQuestions: (questions: ClarifyingQuestion[]) => void;
  startClarifying: () => void;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setDirections: (directions: DirectionOption[]) => void;
  selectDirection: (directionId: string) => void;
  addDocSection: (section: DocSection) => void;
  updateDocSection: (sectionId: string, updates: Partial<DocSection>) => void;
  applyRefinement: (action: RefinementAction) => void;
  undoRefinement: (sectionId: string) => void;
  setProjectTitle: (title: string) => void;
  setSavedProjectId: (id: number | null) => void;
  reset: () => void;
  // New actions
  setVaguenessScores: (scores: VaguenessScores) => void;
  setThreshold: (threshold: number) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
}

const initialState: WorkspaceState & {
  vaguenessScores: VaguenessScores | null;
  threshold: number;
  chatMessages: ChatMessage[];
} = {
  phase: 'idea_input',
  currentQuestionIndex: 0,
  ideaInput: '',
  questions: [],
  directions: [],
  selectedDirectionId: null,
  documentSections: [],
  refinementHistory: [],
  projectTitle: '',
  savedProjectId: null,
  vaguenessScores: null,
  threshold: 7,
  chatMessages: [],
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions & {
  vaguenessScores: VaguenessScores | null;
  threshold: number;
  chatMessages: ChatMessage[];
}>((set, get) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),

  setIdeaInput: (input) => set({ ideaInput: input }),

  setQuestions: (questions) => set({ questions }),

  startClarifying: () => set({
    phase: 'clarifying_questions',
    currentQuestionIndex: 0,
  }),

  answerQuestion: (questionId, answer) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === questionId ? { ...q, answer } : q
      ),
    })),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.questions.length - 1
      ),
    })),

  previousQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),

  setDirections: (directions) => set({ directions, phase: 'direction_selection' }),

  selectDirection: (directionId) =>
    set({ selectedDirectionId: directionId, phase: 'generating' }),

  addDocSection: (section) =>
    set((state) => {
      const existing = state.documentSections.find((s) => s.id === section.id);
      if (existing) {
        return {
          documentSections: state.documentSections.map((s) =>
            s.id === section.id ? { ...s, ...section } : s
          ),
        };
      }
      return {
        documentSections: [...state.documentSections, section],
      };
    }),

  updateDocSection: (sectionId, updates) =>
    set((state) => ({
      documentSections: state.documentSections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    })),

  applyRefinement: (action) =>
    set((state) => ({
      refinementHistory: [...state.refinementHistory, { ...action, applied: true }],
      documentSections: state.documentSections.map((s) =>
        s.id === action.sectionId
          ? { ...s, content: action.suggestedContent ?? s.content }
          : s
      ),
    })),

  undoRefinement: (sectionId) => {
    const state = get();
    const lastRefinement = [...state.refinementHistory]
      .reverse()
      .find((r) => r.sectionId === sectionId);
    if (!lastRefinement) return;
    set({
      refinementHistory: state.refinementHistory.filter(
        (r) => r !== lastRefinement
      ),
      documentSections: state.documentSections.map((s) =>
        s.id === sectionId ? { ...s, content: lastRefinement.originalContent } : s
      ),
    });
  },

  setProjectTitle: (title) => set({ projectTitle: title }),

  setSavedProjectId: (id) => set({ savedProjectId: id }),

  reset: () => set({ ...initialState }),

  // New actions
  setVaguenessScores: (scores) => set({ vaguenessScores: scores }),

  setThreshold: (threshold) => set({ threshold }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  setChatMessages: (messages) => set({ chatMessages: messages }),
}));
```

- [ ] **Step 2: Add tests for new store actions**

Append these tests to `apps/web/src/__tests__/workspace-store.test.ts`:

```typescript
// apps/web/src/__tests__/workspace-store.test.ts — append to existing describe block

  it('setVaguenessScores stores evaluation results', () => {
    const scores = {
      borderlineCase: 4,
      scalarTerms: 6,
      quantitativeImprecision: 3,
      subjectiveModality: 8,
      contextDependence: 5,
      overallScore: 5.2,
      thresholdMet: false,
      weakDimensions: ['quantitativeImprecision', 'borderlineCase'],
    };
    useWorkspaceStore.getState().setVaguenessScores(scores);
    expect(useWorkspaceStore.getState().vaguenessScores).toEqual(scores);
  });

  it('setThreshold updates the threshold value', () => {
    useWorkspaceStore.getState().setThreshold(8);
    expect(useWorkspaceStore.getState().threshold).toBe(8);
  });

  it('addChatMessage appends a message with auto-generated id and timestamp', () => {
    useWorkspaceStore.getState().addChatMessage({
      role: 'user',
      content: 'Hello',
    });
    const messages = useWorkspaceStore.getState().chatMessages;
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello');
    expect(messages[0].id).toBeDefined();
    expect(messages[0].timestamp).toBeDefined();
  });

  it('setChatMessages replaces all messages', () => {
    const msgs: import('@/types/workspace').ChatMessage[] = [
      { id: '1', role: 'user', content: 'Hi', timestamp: 1000 },
      { id: '2', role: 'system', content: 'Hello', timestamp: 2000 },
    ];
    useWorkspaceStore.getState().setChatMessages(msgs);
    expect(useWorkspaceStore.getState().chatMessages).toEqual(msgs);
  });

  it('reset clears vagueness scores and chat messages', () => {
    useWorkspaceStore.getState().setVaguenessScores({
      borderlineCase: 5, scalarTerms: 5, quantitativeImprecision: 5,
      subjectiveModality: 5, contextDependence: 5, overallScore: 5,
      thresholdMet: false, weakDimensions: [],
    });
    useWorkspaceStore.getState().addChatMessage({ role: 'user', content: 'test' });
    useWorkspaceStore.getState().reset();
    const state = useWorkspaceStore.getState();
    expect(state.vaguenessScores).toBeNull();
    expect(state.chatMessages).toEqual([]);
  });
```

- [ ] **Step 3: Run tests to verify all pass**

Run: `npm test -- --run` in `apps/web/`
Expected: All tests pass (existing + new)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/workspace-store.ts apps/web/src/__tests__/workspace-store.test.ts
git commit -m "store: add vagueness scores, threshold, and chat message state"
```

---

### Task 3: Update useWorkspace Hook to Expose New State

**Files:**
- Modify: `apps/web/src/hooks/use-workspace.ts`

- [ ] **Step 1: Add new state and actions to the hook**

Replace the entire file:

```typescript
// apps/web/src/hooks/use-workspace.ts
import { useWorkspaceStore } from '@/lib/workspace-store';

export function useWorkspace() {
  const store = useWorkspaceStore();
  return {
    // State
    phase: store.phase,
    ideaInput: store.ideaInput,
    questions: store.questions,
    currentQuestionIndex: store.currentQuestionIndex,
    currentQuestion: store.questions[store.currentQuestionIndex] ?? null,
    directions: store.directions,
    selectedDirectionId: store.selectedDirectionId,
    documentSections: store.documentSections,
    refinementHistory: store.refinementHistory,
    projectTitle: store.projectTitle,
    savedProjectId: store.savedProjectId,
    // New state
    vaguenessScores: store.vaguenessScores,
    threshold: store.threshold,
    chatMessages: store.chatMessages,

    // Computed
    canGoPrevious: store.currentQuestionIndex > 0,
    canGoNext: store.currentQuestionIndex < store.questions.length - 1,
    completedSections: store.documentSections.filter((s) => s.status === 'complete'),
    generatingSections: store.documentSections.filter((s) => s.status === 'generating'),

    // Actions
    setIdeaInput: store.setIdeaInput,
    setQuestions: store.setQuestions,
    startClarifying: store.startClarifying,
    answerQuestion: store.answerQuestion,
    nextQuestion: store.nextQuestion,
    previousQuestion: store.previousQuestion,
    setDirections: store.setDirections,
    selectDirection: store.selectDirection,
    addDocSection: store.addDocSection,
    updateDocSection: store.updateDocSection,
    applyRefinement: store.applyRefinement,
    undoRefinement: store.undoRefinement,
    setPhase: store.setPhase,
    setProjectTitle: store.setProjectTitle,
    setSavedProjectId: store.setSavedProjectId,
    reset: store.reset,
    // New actions
    setVaguenessScores: store.setVaguenessScores,
    setThreshold: store.setThreshold,
    addChatMessage: store.addChatMessage,
    setChatMessages: store.setChatMessages,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/use-workspace.ts
git commit -m "hooks: expose vagueness scores, threshold, and chat messages in useWorkspace"
```

---

### Task 4: Add Vagueness Evaluator API Method & Fix SSE

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add vagueness evaluation types and method**

Add these types near the top of `api.ts`, after the existing workspace types (around line 43):

```typescript
// apps/web/src/lib/api.ts — add after WorkspaceRefineResponse interface

export interface WorkspaceEvaluateResponse {
  scores: {
    borderline_case: number;
    scalar_terms: number;
    quantitative_imprecision: number;
    subjective_modality: number;
    context_dependence: number;
  };
  overall_score: number;
  threshold_met: boolean;
  weak_dimensions: string[];
  targeted_questions: Array<{
    id: string;
    question: string;
    type: 'choice' | 'free_text';
    options?: string[];
  }>;
}
```

- [ ] **Step 2: Add the evaluateVagueness method to ApiClient class**

Add this method inside the `ApiClient` class, after the existing workspace methods (after `saveWorkspace`):

```typescript
// apps/web/src/lib/api.ts — add inside ApiClient class, after saveWorkspace method

  async evaluateVagueness(idea: string): Promise<WorkspaceEvaluateResponse> {
    return this.request<WorkspaceEvaluateResponse>('/api/workspace/evaluate', {
      method: 'POST',
      body: JSON.stringify({ idea }),
    });
  }
```

- [ ] **Step 3: Fix generateDocument to use SSE streaming**

Replace the existing `generateDocument` method in `ApiClient`:

```typescript
// Replace the existing generateDocument method with:

  async streamDocument(
    directionId: string,
    brief: string,
    onEvent: (event: {
      type: string;
      section_id?: string;
      title?: string;
      content?: string;
      order?: number;
    }) => void,
  ): Promise<void> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (this._token) {
      headers.set('Authorization', `Bearer ${this._token}`);
    }

    const response = await fetch(`${API_URL}/api/workspace/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ direction_id: directionId, brief }),
    });

    if (!response.ok) {
      throw new ApiError('api_error', 'Failed to start document generation', response.status);
    }

    if (!response.body) {
      throw new ApiError('network_error', 'Response body is null', 0);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event);
          } catch {
            // Skip malformed events
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "api: add vagueness evaluator endpoint and fix SSE streaming"
```

---

### Task 5: Create Vagueness Report Component

**Files:**
- Create: `apps/web/src/components/workspace/vagueness-report.tsx`

- [ ] **Step 1: Create the vagueness report component**

```typescript
// apps/web/src/components/workspace/vagueness-report.tsx
"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { VaguenessScores } from "@/types/workspace";

interface VaguenessReportProps {
  scores: VaguenessScores;
}

const DIMENSION_LABELS: Record<string, string> = {
  borderlineCase: "Borderline Cases",
  scalarTerms: "Scalar Terms",
  quantitativeImprecision: "Quantitative Precision",
  subjectiveModality: "Subjective Modality",
  contextDependence: "Context Dependence",
};

export function VaguenessReport({ scores }: VaguenessReportProps) {
  const dimensions = [
    "borderlineCase",
    "scalarTerms",
    "quantitativeImprecision",
    "subjectiveModality",
    "contextDependence",
  ] as const;

  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          Vagueness Analysis
        </h3>
        {scores.thresholdMet ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready to Generate
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs Clarification
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Overall</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              scores.thresholdMet ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${(scores.overallScore / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-foreground">
          {scores.overallScore.toFixed(1)}/10
        </span>
      </div>

      <div className="space-y-2">
        {dimensions.map((dim) => {
          const score = scores[dim] as number;
          const isWeak = score < 6;
          return (
            <div key={dim} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 truncate">
                {DIMENSION_LABELS[dim]}
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isWeak ? "bg-red-400" : "bg-primary"
                  }`}
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                {score}/10
              </span>
            </div>
          );
        })}
      </div>

      {scores.weakDimensions.length > 0 && !scores.thresholdMet && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Targeting:
          </p>
          <ul className="space-y-0.5">
            {scores.weakDimensions.map((dim) => (
              <li key={dim} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {DIMENSION_LABELS[dim] || dim}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workspace/vagueness-report.tsx
git commit -m "components: add vagueness report card component"
```

---

### Task 6: Create Chat Message & Hybrid Chat Input Components

**Files:**
- Create: `apps/web/src/components/workspace/chat-message.tsx`
- Create: `apps/web/src/components/workspace/hybrid-chat-input.tsx`
- Create: `apps/web/src/components/workspace/workspace-chat-feed.tsx`

- [ ] **Step 1: Create chat-message.tsx**

```typescript
// apps/web/src/components/workspace/chat-message.tsx
"use client";

import type { ChatMessage } from "@/types/workspace";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary/10 text-foreground"
            : "bg-muted/50 text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create hybrid-chat-input.tsx**

```typescript
// apps/web/src/components/workspace/hybrid-chat-input.tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";

interface HybridChatInputProps {
  onSend?: (message: string) => void;
  placeholder?: string;
}

export function HybridChatInput({
  onSend,
  placeholder = "Ask a question or add context...",
}: HybridChatInputProps) {
  const { addChatMessage } = useWorkspace();
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;

    addChatMessage({ role: "user", content: input.trim() });

    if (onSend) {
      onSend(input.trim());
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px] max-h-[120px]"
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim()}
        size="sm"
        className="h-9 w-9 p-0 shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create workspace-chat-feed.tsx**

```typescript
// apps/web/src/components/workspace/workspace-chat-feed.tsx
"use client";

import { useEffect, useRef } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { ChatMessageItem } from "./chat-message";

export function WorkspaceChatFeed() {
  const { chatMessages } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (chatMessages.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="space-y-4 overflow-y-auto max-h-[60vh] pr-2"
    >
      {chatMessages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/workspace/chat-message.tsx apps/web/src/components/workspace/hybrid-chat-input.tsx apps/web/src/components/workspace/workspace-chat-feed.tsx
git commit -m "components: add chat message, hybrid input, and chat feed components"
```

---

### Task 7: Wire Up Vagueness Evaluation in IdeaInput

**Files:**
- Modify: `apps/web/src/components/workspace/idea-input.tsx`

- [ ] **Step 1: Update IdeaInput to trigger vagueness evaluation**

Replace the entire file:

```typescript
// apps/web/src/components/workspace/idea-input.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ClarifyingQuestion, VaguenessScores } from "@/types/workspace";
import { VaguenessReport } from "./vagueness-report";

const FALLBACK_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "q1",
    question: "Who is the primary user of this product?",
    type: "choice",
    options: ["End consumers (B2C)", "Other businesses (B2B)", "Internal team use"],
    answer: null,
  },
  {
    id: "q2",
    question: "What platform do you want to target first?",
    type: "choice",
    options: ["Web app", "Mobile app", "Both", "Desktop"],
    answer: null,
  },
  {
    id: "q3",
    question: "What is the core problem this product solves?",
    type: "free_text",
    answer: null,
  },
  {
    id: "q4",
    question: "Do you have any key differentiators vs existing solutions?",
    type: "free_text",
    answer: null,
  },
];

function mapVaguenessScores(raw: {
  borderline_case: number;
  scalar_terms: number;
  quantitative_imprecision: number;
  subjective_modality: number;
  context_dependence: number;
  overall_score: number;
  threshold_met: boolean;
  weak_dimensions: string[];
}): VaguenessScores {
  return {
    borderlineCase: raw.borderline_case,
    scalarTerms: raw.scalar_terms,
    quantitativeImprecision: raw.quantitative_imprecision,
    subjectiveModality: raw.subjective_modality,
    contextDependence: raw.context_dependence,
    overallScore: raw.overall_score,
    thresholdMet: raw.threshold_met,
    weakDimensions: raw.weak_dimensions,
  };
}

export function IdeaInput() {
  const {
    ideaInput,
    setIdeaInput,
    startClarifying,
    setQuestions,
    phase,
    vaguenessScores,
    setVaguenessScores,
    setPhase,
    setDirections,
    addChatMessage,
  } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ideaInput.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await api.evaluateVagueness(ideaInput);
      const scores = mapVaguenessScores({
        borderline_case: response.scores.borderline_case,
        scalar_terms: response.scores.scalar_terms,
        quantitative_imprecision: response.scores.quantitative_imprecision,
        subjective_modality: response.scores.subjective_modality,
        context_dependence: response.scores.context_dependence,
        overall_score: response.overall_score,
        threshold_met: response.threshold_met,
        weak_dimensions: response.weak_dimensions,
      });
      setVaguenessScores(scores);

      if (scores.thresholdMet) {
        addChatMessage({
          role: "system",
          content: "Your idea is clear and specific enough to generate a spec. Let's pick a direction.",
        });
        setPhase("direction_selection");
        setIsSubmitting(false);
        return;
      }

      // Use targeted questions from the evaluator, or fall back
      const questions: ClarifyingQuestion[] = (response.targeted_questions ?? []).map(
        (q, i) => ({
          id: q.id ?? `q${i + 1}`,
          question: q.question,
          type: (q.type === "choice" ? "choice" : "free_text") as "choice" | "free_text",
          options: q.options,
          answer: null,
        })
      );

      if (questions.length > 0 && questions.every((q) => q.question)) {
        setQuestions(questions);
        startClarifying();
        setIsSubmitting(false);
        return;
      }
    } catch {
      // API unavailable — use fallback
    }

    // Fallback: use generic questions
    setQuestions(FALLBACK_QUESTIONS);
    startClarifying();
    setIsSubmitting(false);
  };

  if (phase !== "idea_input" && phase !== "evaluating") {
    return (
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm opacity-70 transition-opacity hover:opacity-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Initial Idea</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ideaInput}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            What are you building?
          </h2>
          <p className="text-sm text-muted-foreground">
            Describe your idea in a sentence or two. We&apos;ll analyze it for clarity and help you refine it.
          </p>
        </div>

        <textarea
          value={ideaInput}
          onChange={(e) => setIdeaInput(e.target.value)}
          placeholder="I want to build a..."
          rows={4}
          className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-shadow"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!ideaInput.trim() || isSubmitting}
            size="lg"
            className="gap-2"
          >
            {isSubmitting ? (
              <>Analyzing...</>
            ) : (
              <>
                Start Crafting
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Need inspiration?
          </Button>
        </div>
      </div>

      {vaguenessScores && <VaguenessReport scores={vaguenessScores} />}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workspace/idea-input.tsx
git commit -m "components: wire vagueness evaluation into idea input"
```

---

### Task 8: Enhance ClarifyingQuestions with Hybrid Chat

**Files:**
- Modify: `apps/web/src/components/workspace/clarifying-questions.tsx`

- [ ] **Step 1: Add hybrid chat input to clarifying questions**

Replace the entire file:

```typescript
// apps/web/src/components/workspace/clarifying-questions.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SkipForward, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type { DirectionOption } from "@/types/workspace";
import { HybridChatInput } from "./hybrid-chat-input";

const FALLBACK_DIRECTIONS: DirectionOption[] = [
  {
    id: "dir-a",
    title: "MVP First",
    description: "Build the core features quickly, launch to early users, then iterate based on feedback.",
    tags: ["lean", "fast", "validated-learning"],
  },
  {
    id: "dir-b",
    title: "Full-Featured",
    description: "Plan and build a comprehensive solution with all key features from the start.",
    tags: ["polished", "complete", "enterprise-ready"],
  },
  {
    id: "dir-c",
    title: "Hybrid Approach",
    description: "Start with a solid core but architect for scale — build the foundation right, add features iteratively.",
    tags: ["balanced", "scalable", "pragmatic"],
  },
];

export function ClarifyingQuestions() {
  const {
    questions,
    currentQuestionIndex,
    currentQuestion,
    canGoPrevious,
    canGoNext,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    setDirections,
    phase,
    addChatMessage,
  } = useWorkspace();

  const [localAnswer, setLocalAnswer] = useState<string>("");

  if (!currentQuestion) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No questions available.
      </div>
    );
  }

  const fetchDirections = async () => {
    const answers: Record<string, string> = {};
    for (const q of questions) {
      if (q.answer) answers[q.id] = q.answer;
    }
    try {
      const response = await api.getDirections(answers);
      const dirs: DirectionOption[] = (response.directions ?? []).map(
        (d) => ({
          id: d.id ?? "",
          title: d.title ?? "",
          description: d.description ?? "",
          tags: d.tags ?? [],
        })
      );
      if (dirs.length >= 2 && dirs.every((d) => d.id && d.title)) {
        setDirections(dirs);
        return;
      }
    } catch {
      // API unavailable
    }
    setDirections(FALLBACK_DIRECTIONS);
  };

  const handleAnswer = () => {
    if (!localAnswer.trim()) return;

    answerQuestion(currentQuestion.id, localAnswer.trim());

    if (canGoNext) {
      nextQuestion();
      setLocalAnswer("");
    } else {
      fetchDirections();
    }
  };

  const handleSkip = () => {
    if (canGoNext) {
      nextQuestion();
      setLocalAnswer("");
    } else {
      fetchDirections();
    }
  };

  const handleChatSend = (message: string) => {
    // Send to backend chat endpoint if available, otherwise just acknowledge
    addChatMessage({
      role: "system",
      content: `Thanks for your note. When you're ready, please answer: "${currentQuestion.question}"`,
    });
  };

  const answeredQuestions = questions.filter((q) => q.answer !== null);

  if (phase !== "clarifying_questions" && phase !== "idea_input") {
    return (
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm opacity-70 transition-opacity hover:opacity-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Clarifying Questions</h3>
            <p className="text-sm text-muted-foreground mt-1">{answeredQuestions.length} questions answered</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-lg text-foreground tracking-tight">Sharpening your brief</span>
          <span className="text-muted-foreground">
            {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-base font-medium text-foreground">
          {currentQuestion.question}
        </p>

        {currentQuestion.type === "choice" && currentQuestion.options ? (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => setLocalAnswer(option)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                  localAnswer === option
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border bg-background text-foreground hover:border-muted-foreground/30"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {canGoPrevious && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const prevIdx = currentQuestionIndex - 1;
                  previousQuestion();
                  setLocalAnswer(prevIdx >= 0 ? (questions[prevIdx]?.answer ?? "") : "");
                }}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="gap-1 text-xs text-muted-foreground"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </Button>
            <Button
              size="sm"
              onClick={handleAnswer}
              disabled={!localAnswer.trim()}
              className="gap-1 text-xs"
            >
              {canGoNext ? "Next" : "See Directions"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {answeredQuestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Your answers so far
          </p>
          <div className="space-y-1.5">
            {answeredQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-primary mt-0.5 shrink-0">→</span>
                <div>
                  <span className="text-foreground font-medium">{q.question}</span>
                  <span className="ml-1.5 text-muted-foreground">{q.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <HybridChatInput onSend={handleChatSend} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workspace/clarifying-questions.tsx
git commit -m "components: add hybrid chat input to clarifying questions"
```

---

### Task 9: Update Landing Page to Single "Start Workshop" CTA

**Files:**
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Replace landing page content**

Replace the entire file:

```typescript
// apps/web/src/app/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { PersonaSelector } from "@/components/persona/persona-selector";
import { ArrowRight, Sparkles, User } from "lucide-react";
import DraftBanner from "@/components/landing/draft-banner";

export default function Home() {
  const { user } = useAuthStore();
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  return (
    <div className="relative flex flex-col min-h-full">
      <DraftBanner />

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center lg:p-24">
        {/* Decorative technical elements */}
        <div className="absolute top-8 left-8 hidden lg:block pointer-events-none overflow-hidden h-24 w-24 border-l border-t border-primary/40 opacity-50">
          <span className="absolute top-1 left-2 text-[10px] font-mono text-primary/60">X: 00.00</span>
          <span className="absolute top-5 left-2 text-[10px] font-mono text-primary/60">Y: 00.00</span>
        </div>
        <div className="absolute bottom-8 right-8 hidden lg:block pointer-events-none overflow-hidden h-24 w-24 border-r border-b border-primary/40 opacity-50">
          <span className="absolute bottom-1 right-2 text-[10px] font-mono text-primary/60">REV: 2.0.0</span>
        </div>

        <div className="max-w-4xl space-y-12 z-10">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 border border-primary/30 bg-primary/5 rounded-sm mb-4">
              <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Workshop Studio</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-mono uppercase">
              specs<br />before<br /><span className="text-primary underline decoration-primary/30 underline-offset-8">code</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed font-sans leading-relaxed">
              Co-create software specifications with AI. Refine your idea through guided clarification, then generate a complete spec — all in one workspace.
            </p>
          </div>

          {/* Persona Selector */}
          {user && !showPersonaSelector && (
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPersonaSelector(true)}
                className="font-mono uppercase text-[10px] tracking-widest rounded-none"
              >
                <User className="h-3 w-3 mr-2" />
                Role: {user.persona || "Set your role"}
              </Button>
            </div>
          )}

          {showPersonaSelector && user && (
            <div className="max-w-2xl mx-auto">
              <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] mb-4 text-center">
                Select Your Role
              </div>
              <PersonaSelector
                currentPersona={user.persona}
                onSelect={() => setShowPersonaSelector(false)}
              />
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPersonaSelector(false)}
                  className="font-mono uppercase text-[10px]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="pt-4">
            <Link href={user ? "/workspace" : "/auth/login"}>
              <Button size="xl" className="font-mono uppercase tracking-widest rounded-none h-14 px-12 gap-3 text-base">
                Start Workshop
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              {user ? "Open the Workshop Studio" : "Sign in to start building"}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-primary/20 bg-background/50 backdrop-blur-sm">
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary/20 space-y-4 hover:bg-primary/5 transition-colors group">
              <div className="text-xs font-mono text-primary/60 group-hover:text-primary transition-colors">[01]</div>
              <h3 className="font-mono font-bold text-xl uppercase tracking-tight">Agent Swarm</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Domain-specific AI agents collaborate on technical architecture and product requirements.
              </p>
            </div>
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary/20 space-y-4 hover:bg-primary/5 transition-colors group">
              <div className="text-xs font-mono text-primary/60 group-hover:text-primary transition-colors">[02]</div>
              <h3 className="font-mono font-bold text-xl uppercase tracking-tight">System Specs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Auto-generate PRDs, ERDs, and Open API documentation with production-ready precision.
              </p>
            </div>
            <div className="p-8 space-y-4 hover:bg-primary/5 transition-colors group">
              <div className="text-xs font-mono text-primary/60 group-hover:text-primary transition-colors">[03]</div>
              <h3 className="font-mono font-bold text-xl uppercase tracking-tight">Binary Logic</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Minimize technical debt by establishing clear specifications before committing to code.
              </p>
            </div>
          </div>

          {/* Secondary CTA for non-authenticated users */}
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="xl" className="font-mono uppercase tracking-widest rounded-none h-14 px-8">
                <Link href="/auth/login" className="gap-2">
                  Deploy Agent <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="font-mono uppercase tracking-widest rounded-none h-14 px-8 border-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                <Link href="https://github.com/firepenguindisopanda/idea-sprinter" target="_blank">
                  Source Repo [v2]
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "pages: replace landing page with single Workshop Studio CTA"
```

---

### Task 10: Update Header Navigation

**Files:**
- Modify: `apps/web/src/components/header.tsx`

- [ ] **Step 1: Remove legacy links from header nav**

In `header.tsx`, find the `links` array (around line 37) and replace it:

```typescript
// Replace the links array in header.tsx:

  const links: { to: Route; label: string }[] = [
    { to: "/" as Route, label: "Home" },
    ...(user ? [
      { to: "/workspace" as Route, label: "Workshop" },
      { to: "/dashboard" as Route, label: "Dashboard" },
    ] : [])
  ];
```

This removes `/ideation`, `/prd`, and `/generate` from the navigation. The pages still exist and are accessible via direct URL.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/header.tsx
git commit -m "components: remove legacy links from header navigation"
```

---

### Task 11: Add "The Relics" Section to Dashboard

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Add The Relics section to dashboard**

Add this section after the projects grid in `dashboard/page.tsx`. Insert it after the closing `</div>` of the projects section (after line 143, before the closing `</ProtectedRoute>`):

```typescript
// apps/web/src/app/dashboard/page.tsx — add before </ProtectedRoute>

        {/* The Relics */}
        <div className="relative">
          <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-primary/20 select-none uppercase">Legacy</div>
          <div className="border border-primary/10 bg-muted/20 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-mono font-bold uppercase tracking-tighter text-muted-foreground">
                The Relics
              </h2>
              <p className="text-sm text-muted-foreground/70">
                Older tools, still functional. The Workshop Studio is the recommended experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/ideation"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <span className="text-sm">💡</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Ideation</div>
                  <div className="text-[10px] text-muted-foreground/60">Brainstorm & refine</div>
                </div>
              </Link>

              <Link
                href="/generate"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="text-sm">⚡</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Generator</div>
                  <div className="text-[10px] text-muted-foreground/60">Direct spec generation</div>
                </div>
              </Link>

              <Link
                href="/prd"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <span className="text-sm">📄</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">PRD Agent</div>
                  <div className="text-[10px] text-muted-foreground/60">Product requirements doc</div>
                </div>
              </Link>

              <Link
                href="/architecture"
                className="group flex items-center gap-3 p-4 rounded-lg border border-primary/10 bg-background/50 hover:border-primary/30 hover:bg-primary/5 transition-all opacity-70 hover:opacity-100"
              >
                <div className="h-8 w-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                  <span className="text-sm">🏗️</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">Architecture</div>
                  <div className="text-[10px] text-muted-foreground/60">Compare architectures</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
```

Also update the "New Project" button to point to `/workspace` instead of `/generate`:

```typescript
// Replace the Link href="/generate" with:
<Link href="/workspace">
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "pages: add The Relics section to dashboard"
```

---

### Task 12: Add Vagueness Evaluator Backend Endpoint

**Files:**
- Modify: `multi-agent-system/app/routers/workspace.py`

- [ ] **Step 1: Add the evaluate endpoint to workspace.py**

Add these imports at the top of the file (after existing imports):

```python
# multi-agent-system/app/routers/workspace.py — add to imports section
from app.core.schemas import TeamRole
```

Add the Pydantic models after the existing ones (after `WorkspaceSaveRequest`):

```python
# multi-agent-system/app/routers/workspace.py — add after WorkspaceSaveRequest class

class VaguenessEvaluateRequest(BaseModel):
    idea: str


class VaguenessEvaluateResponse(BaseModel):
    scores: dict[str, int]
    overall_score: float
    threshold_met: bool
    weak_dimensions: list[str]
    targeted_questions: list[dict[str, Any]]
```

Add the endpoint function after the `save_workspace` function:

```python
# multi-agent-system/app/routers/workspace.py — add after save_workspace function

@router.post("/evaluate", response_model=VaguenessEvaluateResponse)
@with_retry(max_retries=2, base_delay=1.0)
async def evaluate_vagueness(req: VaguenessEvaluateRequest) -> VaguenessEvaluateResponse:
    """Evaluate the vagueness of a project idea across 5 dimensions and generate targeted questions."""
    if not req.idea.strip():
        return VaguenessEvaluateResponse(
            scores={
                "borderline_case": 0,
                "scalar_terms": 0,
                "quantitative_imprecision": 0,
                "subjective_modality": 0,
                "context_dependence": 0,
            },
            overall_score=0.0,
            threshold_met=False,
            weak_dimensions=["borderline_case", "scalar_terms", "quantitative_imprecision", "subjective_modality", "context_dependence"],
            targeted_questions=_fallback_questions(),
        )

    system_prompt = """Evaluate the following project idea against these 5 dimensions of vagueness. Score each 0-10 (10 = perfectly specific).

1. Borderline Case Test: Are there borderline cases where it's unclear if the statement is true or false? (10 = no borderline cases, fully measurable)
2. Scalar/Gradable Terms: Does it use words on a spectrum (fast, good, many) without a baseline? (10 = no scalar terms, all specific)
3. Quantitative Imprecision: Does it use vague quantities (many, few, some) instead of exact numbers? (10 = all quantities are exact)
4. Subjective Modality: Does it rely on personal judgment or weak modals (kind of, usually, might)? (10 = no subjective language)
5. Context Dependence: Does the meaning depend heavily on situational context? (10 = fully self-contained, no context needed)

Respond with a JSON object:
{
  "scores": {
    "borderline_case": <0-10>,
    "scalar_terms": <0-10>,
    "quantitative_imprecision": <0-10>,
    "subjective_modality": <0-10>,
    "context_dependence": <0-10>
  },
  "weak_dimensions": ["list of dimension names scoring below 6"],
  "targeted_questions": [
    {"id": "q1", "question": "...", "type": "choice|free_text", "options": ["..."]}
  ]
}

Generate 2-4 targeted questions ONLY for the weak dimensions (score < 6).
Return ONLY the JSON object."""

    try:
        llm = get_chat_model(
            role=TeamRole.PRODUCT_OWNER,
            model=DEFAULT_MODEL,
            temperature=0.2,
            max_tokens=1024,
        )
        response = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Project idea: {req.idea}"},
        ])
        content = _normalize_content(response.content)
        result = _extract_json(content)

        if result and isinstance(result, dict) and "scores" in result:
            scores = result["scores"]
            # Validate scores are integers 0-10
            validated_scores = {}
            for key in ["borderline_case", "scalar_terms", "quantitative_imprecision", "subjective_modality", "context_dependence"]:
                val = scores.get(key, 5)
                validated_scores[key] = max(0, min(10, int(val)))

            overall = sum(validated_scores.values()) / len(validated_scores)
            threshold = 7
            weak = result.get("weak_dimensions", [k for k, v in validated_scores.items() if v < 6])
            questions = result.get("targeted_questions", [])

            # Validate questions
            validated_questions = []
            for i, q in enumerate(questions):
                if isinstance(q, dict) and "question" in q and "type" in q:
                    q.setdefault("id", f"q{i+1}")
                    validated_questions.append(q)

            return VaguenessEvaluateResponse(
                scores=validated_scores,
                overall_score=round(overall, 1),
                threshold_met=overall >= threshold,
                weak_dimensions=weak if isinstance(weak, list) else [],
                targeted_questions=validated_questions if validated_questions else _fallback_questions(),
            )

        logger.warning("Could not parse vagueness evaluation from LLM response, using fallback")
    except Exception as e:
        logger.error(f"Failed to evaluate vagueness: {e}")

    # Fallback: return neutral scores and generic questions
    return VaguenessEvaluateResponse(
        scores={
            "borderline_case": 5,
            "scalar_terms": 5,
            "quantitative_imprecision": 5,
            "subjective_modality": 5,
            "context_dependence": 5,
        },
        overall_score=5.0,
        threshold_met=False,
        weak_dimensions=["borderline_case", "quantitative_imprecision"],
        targeted_questions=_fallback_questions(),
    )
```

- [ ] **Step 2: Verify the backend router is already included in main.py**

The workspace router is already included in `main.py` at line 303:
```python
app.include_router(workspace_router)  # Workshop Studio endpoints
```

No changes needed to `main.py`.

- [ ] **Step 3: Verify Python syntax**

Run: `python -m py_compile app/routers/workspace.py` in `multi-agent-system/`
Expected: No syntax errors

- [ ] **Step 4: Commit**

```bash
git add multi-agent-system/app/routers/workspace.py
git commit -m "api: add vagueness evaluator endpoint to workspace router"
```

---

### Task 13: Update Workspace Page Layout with Chat Feed

**Files:**
- Modify: `apps/web/src/app/workspace/page.tsx`

- [ ] **Step 1: Update workspace page to include chat feed**

Replace the entire file:

```typescript
// apps/web/src/app/workspace/page.tsx
"use client";

import { useWorkspace } from "@/hooks/use-workspace";
import { TopBar } from "@/components/workspace/top-bar";
import { IdeaInput } from "@/components/workspace/idea-input";
import { ClarifyingQuestions } from "@/components/workspace/clarifying-questions";
import { DirectionSelector } from "@/components/workspace/direction-selector";
import { ProgressiveDoc } from "@/components/workspace/progressive-doc";
import { WorkspaceChatFeed } from "@/components/workspace/workspace-chat-feed";

export default function WorkspacePage() {
  const { phase } = useWorkspace();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[450px_1fr] overflow-hidden">
        {/* Left Column: Command Center Feed */}
        <div className="bg-muted/30 border-r border-border overflow-y-auto p-6 space-y-6">
          <IdeaInput />
          {phase === "evaluating" && <WorkspaceChatFeed />}
          {phase === "clarifying_questions" && (
            <>
              <WorkspaceChatFeed />
              <ClarifyingQuestions />
            </>
          )}
          {phase === "direction_selection" && <DirectionSelector />}
        </div>

        {/* Right Column: Document View */}
        <div className="bg-background overflow-y-auto">
          <ProgressiveDoc />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/workspace/page.tsx
git commit -m "pages: update workspace layout with chat feed integration"
```

---

### Task 14: Update DirectionSelector to Use SSE Hook

**Files:**
- Modify: `apps/web/src/components/workspace/direction-selector.tsx`

- [ ] **Step 1: Replace mock generation with real SSE via api.streamDocument**

Replace the `handleSelect` function in `direction-selector.tsx`. The existing code already has SSE parsing inline — we need to clean it up to use the new `api.streamDocument` method and remove the mock fallback:

```typescript
// In direction-selector.tsx, replace the handleSelect function:

  const handleSelect = async (directionId: string) => {
    selectDirection(directionId);
    initDocSections();
    const brief = buildBrief();

    try {
      const store = useWorkspaceStore.getState();
      await api.streamDocument(directionId, brief, (event) => {
        switch (event.type) {
          case "section_start": {
            store.addDocSection({
              id: event.section_id!,
              title: event.title ?? "Untitled",
              status: "generating",
              content: "",
              order: event.order ?? 0,
            });
            break;
          }
          case "chunk": {
            store.updateDocSection(event.section_id!, {
              content: event.content ?? "",
            });
            break;
          }
          case "section_complete": {
            store.updateDocSection(event.section_id!, {
              status: "complete",
              content: event.content ?? "",
            });
            break;
          }
          case "pipeline_complete": {
            store.setPhase("refinement");
            break;
          }
        }
      });
    } catch {
      // API unavailable — fall back to mock timer
      startMockGeneration();
    }
  };
```

Also remove the `API_URL` constant at the top of the file since it's no longer needed (the `api.streamDocument` method handles the URL internally).

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workspace/direction-selector.tsx
git commit -m "components: use api.streamDocument for SSE in direction selector"
```

---

### Task 15: Final Verification & Cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit` in `apps/web/`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npm run lint` in `apps/web/`
Expected: No new lint errors

- [ ] **Step 3: Run all tests**

Run: `npm test -- --run` in `apps/web/`
Expected: All tests pass

- [ ] **Step 4: Verify build**

Run: `npm run build` in `apps/web/`
Expected: Build succeeds

- [ ] **Step 5: Commit all remaining changes**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```

---

## Self-Review

### 1. Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Vagueness evaluator backend endpoint | Task 12 |
| Vagueness scores types | Task 1 |
| Evaluating phase in store | Task 2 |
| Vagueness report card component | Task 5 |
| SSE streaming fix (api.streamDocument) | Task 4 |
| Hybrid chat input | Task 6, 8 |
| Chat message component | Task 6 |
| Chat feed container | Task 6 |
| IdeaInput triggers evaluation | Task 7 |
| Landing page single CTA | Task 9 |
| Header nav cleanup | Task 10 |
| Dashboard "The Relics" section | Task 11 |
| Workspace page layout update | Task 13 |
| DirectionSelector uses SSE | Task 14 |
| Error handling (fallbacks) | Tasks 4, 7, 8, 12 |
| Tests for new store state | Task 2 |

All spec requirements covered.

### 2. Placeholder Scan

No "TBD", "TODO", "implement later", or vague instructions found. Every step contains actual code.

### 3. Type Consistency

- `VaguenessScores` defined in Task 1, used in Tasks 2, 5, 7
- `ChatMessage` defined in Task 1, used in Tasks 2, 6, 8
- `WorkspacePhase` updated in Task 1 with `'evaluating'`, used in Tasks 2, 7, 13
- `api.streamDocument` defined in Task 4, used in Task 14
- `api.evaluateVagueness` defined in Task 4, used in Task 7
- Backend response uses snake_case (`borderline_case`), frontend uses camelCase (`borderlineCase`) — mapped explicitly in Task 7's `mapVaguenessScores` function

All types are consistent across tasks.
