/**
 * Reading a project's artifacts blob.
 *
 * `Project.artifacts` was originally a map of agent role -> markdown output, and
 * the dashboard still relies on that: it renders the keys as agent chips, counts
 * them as "N Agents", and hands the whole object to the PDF exporter as
 * `markdown_outputs`.
 *
 * The workspace flow later wrote a different shape into the same field -
 * `{type, direction_id, brief, sections}` - so a workspace project showed
 * "4 Agents" and chips reading "type" and "brief", and exported nonsense. These
 * helpers keep the role-map contract intact and quarantine everything else, so
 * both shapes render correctly and the count means what it says.
 *
 * Reserved keys are `_`-prefixed. Legacy workspace keys are recognised by name
 * because records written before this split have no prefix.
 */

import type { JudgeResult } from "@/types";
import type { DesignFinding, DesignResult } from "@/types/workspace";

export type ProjectArtifacts = Record<string, unknown>;

/** Keys the workspace flow wrote directly into artifacts before the split. */
const LEGACY_WORKSPACE_KEYS = new Set([
  "type",
  "direction_id",
  "brief",
  "sections",
]);

function isReserved(key: string): boolean {
  // `sec-` keys are workspace section ids, not agent roles. No role starts with
  // it, so excluding them keeps a stray section id from being counted as an
  // agent if one is ever written at the top level.
  return key.startsWith("_") || key.startsWith("sec-") || LEGACY_WORKSPACE_KEYS.has(key);
}

/**
 * The agent role -> markdown map, with metadata removed.
 *
 * Only string values are returned: every consumer treats these as markdown, and
 * a non-string here means something wrote a shape that does not belong.
 */
export function agentOutputs(artifacts: ProjectArtifacts | null | undefined): Record<string, string> {
  if (!artifacts) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(artifacts)) {
    if (isReserved(key)) continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Agent roles that actually produced output for this project. */
export function agentRoles(artifacts: ProjectArtifacts | null | undefined): string[] {
  return Object.keys(agentOutputs(artifacts));
}

/** True when this project came from the workspace flow rather than the pipeline. */
export function isWorkspaceSpec(artifacts: ProjectArtifacts | null | undefined): boolean {
  if (!artifacts) return false;
  const meta = artifacts._workspace as { sections?: unknown } | undefined;
  return artifacts.type === "workspace_spec" || meta !== undefined;
}

/** Sections from a workspace spec, from either the current or legacy shape. */
export function workspaceSections(
  artifacts: ProjectArtifacts | null | undefined,
): { id: string; title: string; content: string; order: number }[] {
  if (!artifacts) return [];
  const meta = artifacts._workspace as { sections?: unknown } | undefined;
  const raw = meta?.sections ?? artifacts.sections;
  return Array.isArray(raw) ? (raw as { id: string; title: string; content: string; order: number }[]) : [];
}

/**
 * The badge shown on a project card.
 *
 * Returns a count only when there is something real to count. A workspace spec
 * with no agent outputs reports its sections instead of claiming zero agents,
 * and a project with neither says so rather than showing "0".
 */
export function projectSummaryBadge(artifacts: ProjectArtifacts | null | undefined): string {
  const roles = agentRoles(artifacts).length;
  if (roles > 0) return `${roles} ${roles === 1 ? "Agent" : "Agents"}`;

  const sections = workspaceSections(artifacts).length;
  if (sections > 0) return `${sections} ${sections === 1 ? "Section" : "Sections"}`;

  return "No output";
}

/**
 * What the dashboard should actually render for a project.
 *
 * Agent output when there is any; otherwise the workspace spec's own sections.
 * Without the fallback a saved workspace spec renders an empty detail page -
 * its content lives in `sections`, and no agent ever produced a role key.
 */
export function displayOutputs(
  artifacts: ProjectArtifacts | null | undefined,
): Record<string, string> {
  const outputs = agentOutputs(artifacts);
  if (Object.keys(outputs).length > 0) return outputs;

  const fallback: Record<string, string> = {};
  for (const section of workspaceSections(artifacts)) {
    if (section?.id && typeof section.content === "string" && section.content.trim()) {
      fallback[section.id] = section.content;
    }
  }
  return fallback;
}

/**
 * The adversarial review saved alongside a spec.
 *
 * Lives under the reserved `_review` key, so it is quarantined from the role
 * map exactly like `_workspace`. Before this existed the detail page hardcoded
 * `judge_results: {}` - a saved spec showed none of the scrutiny it had been
 * through, because none of it was ever written down.
 */
export function projectReview(artifacts: ProjectArtifacts | null | undefined): {
  judgeResults: Record<string, JudgeResult>;
  contradictions: { type: string; detail: string; severity: string; roles?: string[] }[];
} {
  const empty = { judgeResults: {}, contradictions: [] };
  if (!artifacts) return empty;
  const review = artifacts._review as
    | { judge_results?: unknown; contradictions?: unknown }
    | undefined;
  if (!review) return empty;
  return {
    judgeResults:
      review.judge_results && typeof review.judge_results === "object"
        ? (review.judge_results as Record<string, JudgeResult>)
        : {},
    contradictions: Array.isArray(review.contradictions)
      ? (review.contradictions as {
          type: string;
          detail: string;
          severity: string;
          roles?: string[];
        }[])
      : [],
  };
}

const DESIGN_STATUSES = new Set<string>(["checked", "ledger_unresolved", "document_unresolved", "failed"]);

/**
 * The design a saved project carries, or null when it is not one.
 *
 * Under the reserved `_design` key: the run's status, its plan and what it
 * still failed. A blob with no status this knows is treated as no design at
 * all - the status is never guessed, least of all as "checked".
 */
export function projectDesign(artifacts: ProjectArtifacts | null | undefined): DesignResult | null {
  const raw = artifacts?._design;
  if (!raw || typeof raw !== "object") return null;
  const saved = raw as Partial<DesignResult>;
  if (typeof saved.status !== "string" || !DESIGN_STATUSES.has(saved.status)) return null;
  // The blob is the owner's own JSON and the server checks only its status, so
  // what is rendered is checked here: a finding that is not four strings, or a
  // cost that is not numbers, is left out rather than thrown on.
  const text = (value: unknown): value is string => typeof value === "string";
  const findings = (Array.isArray(saved.findings) ? saved.findings : []).filter(
    (f): f is DesignFinding =>
      !!f && typeof f === "object" && text(f.source) && text(f.code) && text(f.field) && text(f.detail),
  );
  const tokens = saved.tokens;
  const counted =
    !!tokens && [tokens.input, tokens.output, tokens.total, tokens.calls].every((n) => typeof n === "number");
  const grade = saved.key_grade;
  const graded =
    !!grade &&
    typeof grade === "object" &&
    [grade.passed, grade.total, grade.core_passed, grade.core_total].every((n) => typeof n === "number") &&
    text(grade.model);
  return {
    ...saved,
    status: saved.status,
    ledger: saved.ledger ?? null,
    findings,
    context_ids: Array.isArray(saved.context_ids) ? saved.context_ids : [],
    key_grade: graded ? { ...grade, provisional: true } : null,
    tokens: counted ? tokens : undefined,
    seconds: typeof saved.seconds === "number" ? saved.seconds : undefined,
  };
}

/**
 * Whether a project's document was written by a design run.
 *
 * By its saved result, or by its sections alone: a design saved without its
 * result is still no agent's reviewed output, and must not be shown as one.
 */
export function isDesignDocument(artifacts: ProjectArtifacts | null | undefined): boolean {
  if (!artifacts) return false;
  if (artifacts._design && typeof artifacts._design === "object") return true;
  return workspaceSections(artifacts).some((s) => typeof s?.id === "string" && s.id.startsWith("sec-design-"));
}

/**
 * Outputs keyed for export rather than for display.
 *
 * The PDF generator titles a section from its key: it knows the twelve agent
 * roles by name and falls back to title-casing anything else. A workspace spec
 * has no agent roles, so its sections would arrive as `sec-overview` and print
 * as "Sec-Overview" - keyed by their real titles they print properly.
 */
export function exportOutputs(
  artifacts: ProjectArtifacts | null | undefined,
): Record<string, string> {
  const outputs = agentOutputs(artifacts);
  if (Object.keys(outputs).length > 0) return outputs;

  const titled: Record<string, string> = {};
  for (const section of workspaceSections(artifacts)) {
    if (typeof section?.content === "string" && section.content.trim()) {
      titled[section.title || section.id] = section.content;
    }
  }
  return titled;
}

/** Section id -> title, so the renderer can label sections properly. */
export function displayLabels(
  artifacts: ProjectArtifacts | null | undefined,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const section of workspaceSections(artifacts)) {
    if (section?.id && section.title) labels[section.id] = section.title;
  }
  return labels;
}

/**
 * Whether inline editing is safe.
 *
 * Editing writes `artifacts[key] = content`, which is correct for an agent role
 * but would put a bare section id at the top level of a workspace spec, where it
 * belongs under `_workspace.sections`. Read-only is the honest state until that
 * write path understands sections.
 */
export function supportsInlineEditing(
  artifacts: ProjectArtifacts | null | undefined,
): boolean {
  return Object.keys(agentOutputs(artifacts)).length > 0;
}

/** Words that are acronyms, not names - title-casing renders these "Ux", "Qa". */
const ROLE_ACRONYMS: Record<string, string> = {
  ux: "UX",
  ui: "UI",
  api: "API",
  qa: "QA",
  devops: "DevOps",
};

/** Human-readable agent role, e.g. "api_designer" -> "API Designer". */
export function formatRole(role: string): string {
  return role
    .split("_")
    .map((word) => ROLE_ACRONYMS[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
