export interface ExamplePrompt {
  id: string;
  title: string;
  prompt: string;
  why: string;
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: "vague",
    title: "The vague one",
    prompt: "I want to build a productivity tool that helps teams work better together.",
    why: "Maximally vague - tests vagueness detection across all 5 dimensions, generates full clarifying questions.",
  },
  {
    id: "hyper-specific",
    title: "The hyper-specific one",
    prompt: "Mobile app where freelancers photograph receipts, AI extracts amounts/categories, generates monthly P&L reports, supports 45 currencies, exports to PDF/CSV, syncs across devices via iCloud, with recurring expense templates and tax-deductible flagging.",
    why: "Dense with specifics - should clear the vagueness threshold immediately, demonstrating the app can skip clarifying and go straight to direction selection + document generation.",
  },
  {
    id: "marketplace",
    title: "Multi-sided marketplace",
    prompt: "An online marketplace where local artists sell artwork directly to buyers. Artists create profiles, upload hi-res images, set prices, handle fulfillment. Buyers browse by category/style/price, save favorites, message artists, purchase through the platform with escrow hold until delivery confirmed. Platform takes 12% commission, handles dispute resolution. Artists must verify identity before selling. Buyers can return within 14 days if item doesn't match description.",
    why: "Three distinct user roles, real edge cases (escrow, disputes, returns, identity verification) - tests use case generation with meaningful alternative flows.",
  },
  {
    id: "ai-saas",
    title: "AI/ML SaaS",
    prompt: "A web app that generates video subtitles and translations. Users upload MP4/MOV up to 2 hours, AI transcribes with speaker diarization, translates to 30+ languages, lets users edit timestamps/timing in-browser before exporting as SRT/VTT/ASS formats. Target: under 2x real-time processing, 95%+ word accuracy for English, speaker labels in output. Handles 100 concurrent uploads.",
    why: "Brings out Non-Functional Requirements - latency targets (2x real-time), accuracy metrics (95%), concurrency (100), format support. Tests the evaluator's ability to recognize measurable specs.",
  },
  {
    id: "compliance",
    title: "Compliance-heavy enterprise",
    prompt: "A document management system for a healthcare compliance team. Stores HIPAA-covered documents with encryption at rest and in transit, full audit trail of every view/edit/export, role-based access (viewer/editor/admin/compliance-officer), automated retention/deletion policies per document type, digital signature workflows with DocuSign integration, and quarterly access review reports for auditors.",
    why: "Forces Security Considerations to produce real substance - encryption, audit trails, 4-tier RBAC, retention policies, third-party integration, annual compliance reporting.",
  },
  {
    id: "migration",
    title: "Legacy migration / integration",
    prompt: "A backend API gateway that sits between our legacy SOAP inventory system and new React storefront. The gateway translates SOAP to REST, handles auth (OAuth2 + API keys), rate-limits by tenant (1000 req/min per tenant), caches product catalog in Redis with 5-minute TTL, and supports gradual traffic shifting so we can migrate 20% → 50% → 100% over 6 months.",
    why: "Tests Deployment Strategy with real migration planning (gradual traffic shifting, 6-month timeline), integration constraints (SOAP adapter), infrastructure choices (Redis, tenant rate-limiting).",
  },
];
