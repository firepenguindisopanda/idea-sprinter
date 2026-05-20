# Workshop Studio Improvement Design

**Date:** 2026-05-19
**Status:** Draft — Pending User Review
**Scope:** Frontend improvements to the Workshop Studio, backend vagueness evaluator, navigation restructuring

---

## 1. Problem Statement

The current Workshop Studio has a solid two-column layout and component structure, but has several issues:
- The `generateDocument()` API call expects JSON but the backend returns SSE (`text/event-stream`) — a communication mismatch
- Clarifying questions are generic, not targeted to the vagueness of the user's idea
- The landing page presents three equal paths (Ideation, Generate, Architecture) when the Workshop Studio should be the primary experience
- Navigation is cluttered with legacy pages that are no longer the focus

---

## 2. Architecture & Data Flow

### 2.1 New Backend Endpoint: Vagueness Evaluator

**Endpoint:** `POST /api/workspace/evaluate`

**Request:**
```json
{ "idea": "string" }
```

**Response:**
```json
{
  "scores": {
    "borderline_case": 4,
    "scalar_terms": 6,
    "quantitative_imprecision": 3,
    "subjective_modality": 8,
    "context_dependence": 5
  },
  "overall_score": 5.2,
  "threshold_met": false,
  "weak_dimensions": ["quantitative_imprecision", "borderline_case"],
  "targeted_questions": [
    { "id": "q1", "question": "...", "type": "choice|free_text", "options": [...] }
  ]
}
```

**Logic:**
- LLM evaluates the idea against 5 dimensions (0-10 each): Borderline Case Test, Scalar/Gradable Terms, Quantitative Imprecision, Subjective Modality/Generalization, Context Dependence
- `overall_score` = average of all 5 dimensions
- `threshold` = 7 (configurable). If `overall_score >= 7`, skip clarifying questions
- `targeted_questions` are generated only for dimensions scoring < 6

### 2.2 Updated Phase Flow

```
idea_input → evaluating → clarifying_questions → direction_selection → generating → complete
```

New phase: `evaluating` — shows vagueness report card in chat feed.

### 2.3 SSE Streaming Fix

Replace `generateDocument()` (JSON fetch) with a proper SSE reader:

```typescript
async streamDocument(directionId: string, brief: string, onChunk: (data) => void) {
  const response = await fetch(`${API_URL}/api/workspace/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ direction_id: directionId, brief }),
  });
  const reader = response.body.getReader();
  // Parse SSE events: section_start, chunk, section_complete, pipeline_complete
}
```

### 2.4 Hybrid Chat Endpoint (Optional)

**Endpoint:** `POST /api/workspace/chat`

For free-form user messages during the clarifying phase. The LLM responds helpfully but redirects back to the current question. If not implemented, handle client-side with a simple echo/acknowledgment pattern.

---

## 3. Component Design & UI Changes

### 3.1 Landing Page (`/`)

- Replace three-path grid with single "Start Workshop" CTA
- Keep hero branding ("specs before code")
- Two path cards inside workspace: Path A (Guided) and Path B (Full Pipeline)
- Feature grid retained with tightened copy

### 3.2 Header Navigation

**Remove from nav:** `/ideation`, `/prd`, `/generate`
**Keep:** `/` (Home), `/workspace` (Workshop), `/dashboard` (Dashboard)

Old pages remain accessible via direct URL — no route deletion.

### 3.3 Dashboard — "The Relics" Section

New section on dashboard page with muted/desaturated cards linking to:
- PRD Agent (`/prd`)
- Generator (`/generate`)
- Ideation (`/ideation`)
- Architecture (`/architecture`)

### 3.4 Vagueness Report Card (New Component)

Renders in chat feed after idea submission. Shows:
- Overall score (0-10) with threshold indicator
- Per-dimension bar scores
- List of weak dimensions being targeted
- Green checkmark if threshold met (skips to direction selection)

### 3.5 Hybrid Chat Input

Secondary text input below the current question's answer area. Messages appear as chat bubbles in the feed. System responds with clarifications or gentle redirects back to the current question.

### 3.6 SSE Streaming Hook (New)

`useStreamDocument()` hook:
- Parses SSE events: `section_start`, `chunk`, `section_complete`, `pipeline_complete`
- Accumulates markdown content per section in real-time
- Exposes streaming state for progress indicators
- Handles connection errors with retry

### 3.7 Workspace Store Updates

Add to Zustand store:
- `vaguenessScores: VaguenessScores | null`
- `threshold: number` (default 7)
- `chatMessages: ChatMessage[]`
- New actions: `setVaguenessScores`, `addChatMessage`, `setChatMessages`

---

## 4. Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| Backend unavailable for vagueness eval | Client-side heuristic fallback + generic questions |
| LLM returns malformed JSON | Silent fallback to hardcoded questions |
| SSE connection drops mid-generation | Auto-reconnect (3 retries), preserve completed sections |
| User skips all questions | Proceed with original idea text, note "default assumptions" |
| Threshold met immediately (≥7) | Skip clarifying questions, show green report, go to direction selection |
| Hybrid chat goes off-topic | LLM responds helpfully, redirects back to current question |
| Save fails | One auto-retry, error toast, document preserved in store |

---

## 5. Implementation Order (Approach A — Incremental)

1. Fix SSE streaming in `api.ts` (critical bug)
2. Add vagueness evaluator endpoint to backend (`workspace.py`)
3. Add `evaluating` phase and vagueness state to workspace store
4. Create `VaguenessReport` component
5. Update landing page to single "Start Workshop" CTA
6. Update header navigation (remove legacy links)
7. Add "The Relics" section to dashboard
8. Enhance clarifying questions with hybrid chat input
9. Create `useStreamDocument` hook
10. Wire up vagueness evaluation flow in `IdeaInput` component

---

## 6. Files to Modify

### Frontend
- `apps/web/src/app/page.tsx` — Landing page rewrite
- `apps/web/src/components/header.tsx` — Nav link removal
- `apps/web/src/components/workspace/idea-input.tsx` — Add vagueness evaluation trigger
- `apps/web/src/components/workspace/clarifying-questions.tsx` — Hybrid chat input
- `apps/web/src/lib/api.ts` — SSE streaming fix, new evaluate endpoint
- `apps/web/src/lib/workspace-store.ts` — New phases and state
- `apps/web/src/hooks/use-workspace.ts` — Expose new state
- `apps/web/src/app/dashboard/page.tsx` — "The Relics" section
- `apps/web/src/components/workspace/vagueness-report.tsx` — **NEW**
- `apps/web/src/hooks/use-stream-document.ts` — **NEW**

### Backend
- `app/routers/workspace.py` — Add `/evaluate` endpoint

---

## 7. Success Criteria

- SSE streaming works end-to-end (document sections appear in real-time)
- Vagueness evaluator produces structured scores and targeted questions
- Landing page shows single "Start Workshop" CTA
- Header nav only shows Home, Workshop, Dashboard
- Dashboard has "The Relics" section with links to legacy pages
- Hybrid chat input works during clarifying phase
- All error scenarios handled gracefully with fallbacks
