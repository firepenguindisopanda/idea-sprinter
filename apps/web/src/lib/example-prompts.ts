export interface ExamplePrompt {
  id: string;
  title: string;
  prompt: string;
  why: string;
  /** Grouping for the picker. Six is browsable; forty needs filtering. */
  category: string;
  /** The decision a system-design starter's twist forces. Sent with the idea
   *  (see `ideaFor`) so the architect decides it rather than guessing at it. */
  decision?: string;
}

/**
 * The idea text a picked example fills in.
 *
 * A system-design starter carries the decision its twist forces, worded as the
 * Architecture Studio words it (`requirementsForSession`). Without it the
 * architect found that decision in 1 of 5 replays (HANDOFF §63). The generated
 * design is the reference a learner meets after drafting their own, so the
 * generator is the place the answer belongs.
 */
export function ideaFor(example: ExamplePrompt): string {
  if (!example.decision) return example.prompt;
  return `${example.prompt}\n\nThe decision this forces: ${example.decision}`;
}

/** The hand-written prompts below, each chosen to stress a different part of
 *  the pipeline - vagueness detection, NFR extraction, security depth, and so
 *  on. The `why` explains what each one is for. */
export const SHAPES_CATEGORY = "Spec shapes";

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: "vague",
    category: SHAPES_CATEGORY,
    title: "The vague one",
    prompt: "I want to build a productivity tool that helps teams work better together.",
    why: "Maximally vague - tests vagueness detection across all 5 dimensions, generates full clarifying questions.",
  },
  {
    id: "hyper-specific",
    category: SHAPES_CATEGORY,
    title: "The hyper-specific one",
    prompt: "Mobile app where freelancers photograph receipts, AI extracts amounts/categories, generates monthly P&L reports, supports 45 currencies, exports to PDF/CSV, syncs across devices via iCloud, with recurring expense templates and tax-deductible flagging.",
    why: "Dense with specifics - should clear the vagueness threshold immediately, demonstrating the app can skip clarifying and go straight to direction selection + document generation.",
  },
  {
    id: "marketplace",
    category: SHAPES_CATEGORY,
    title: "Multi-sided marketplace",
    prompt: "An online marketplace where local artists sell artwork directly to buyers. Artists create profiles, upload hi-res images, set prices, handle fulfillment. Buyers browse by category/style/price, save favorites, message artists, purchase through the platform with escrow hold until delivery confirmed. Platform takes 12% commission, handles dispute resolution. Artists must verify identity before selling. Buyers can return within 14 days if item doesn't match description.",
    why: "Three distinct user roles, real edge cases (escrow, disputes, returns, identity verification) - tests use case generation with meaningful alternative flows.",
  },
  {
    id: "ai-saas",
    category: SHAPES_CATEGORY,
    title: "AI/ML SaaS",
    prompt: "A web app that generates video subtitles and translations. Users upload MP4/MOV up to 2 hours, AI transcribes with speaker diarization, translates to 30+ languages, lets users edit timestamps/timing in-browser before exporting as SRT/VTT/ASS formats. Target: under 2x real-time processing, 95%+ word accuracy for English, speaker labels in output. Handles 100 concurrent uploads.",
    why: "Brings out Non-Functional Requirements - latency targets (2x real-time), accuracy metrics (95%), concurrency (100), format support. Tests the evaluator's ability to recognize measurable specs.",
  },
  {
    id: "compliance",
    category: SHAPES_CATEGORY,
    title: "Compliance-heavy enterprise",
    prompt: "A document management system for a healthcare compliance team. Stores HIPAA-covered documents with encryption at rest and in transit, full audit trail of every view/edit/export, role-based access (viewer/editor/admin/compliance-officer), automated retention/deletion policies per document type, digital signature workflows with DocuSign integration, and quarterly access review reports for auditors.",
    why: "Forces Security Considerations to produce real substance - encryption, audit trails, 4-tier RBAC, retention policies, third-party integration, annual compliance reporting.",
  },
  {
    id: "migration",
    category: SHAPES_CATEGORY,
    title: "Legacy migration / integration",
    prompt: "A backend API gateway that sits between our legacy SOAP inventory system and new React storefront. The gateway translates SOAP to REST, handles auth (OAuth2 + API keys), rate-limits by tenant (1000 req/min per tenant), caches product catalog in Redis with 5-minute TTL, and supports gradual traffic shifting so we can migrate 20% → 50% → 100% over 6 months.",
    why: "Tests Deployment Strategy with real migration planning (gradual traffic shifting, 6-month timeline), integration constraints (SOAP adapter), infrastructure choices (Redis, tenant rate-limiting).",
  },
];

// Derived from the system design starters
//
// The six above are deliberate test shapes; these are breadth. Each is a
// recognisable system plus one feature the original lacks, which is what makes
// the brief worth writing - the well-known version has a well-known answer.
//
// Reusing SYSTEM_DESIGN_EXAMPLES rather than restating them keeps one source of
// truth with the architecture page.
import {
  SYSTEM_DESIGN_EXAMPLES,
  twistHeadline,
} from "@/lib/system-design-examples";

const SYSTEM_DESIGN_PROMPTS: ExamplePrompt[] = SYSTEM_DESIGN_EXAMPLES.map((e) => ({
  id: `sd-${e.id}`,
  title: `${e.name} + ${twistHeadline(e)}`,
  // The workspace asks for "a sentence or two", so lead with the premise and
  // append the twist rather than pasting the full architecture brief.
  prompt: `${e.premise} On top of that: ${e.twist}`,
  why: e.tension,
  category: e.category,
  decision: e.tension,
}));

/** Everything the picker can offer, curated shapes first. */
export const ALL_EXAMPLE_PROMPTS: ExamplePrompt[] = [
  ...EXAMPLE_PROMPTS,
  ...SYSTEM_DESIGN_PROMPTS,
];

/** Category names in display order. */
export const EXAMPLE_CATEGORIES: string[] = [
  SHAPES_CATEGORY,
  ...Array.from(new Set(SYSTEM_DESIGN_PROMPTS.map((p) => p.category))),
];
