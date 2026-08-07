import { describe, expect, it, vi } from "vitest";
import { downgradeUnparseableDiagrams } from "@/lib/mermaid-guard";

/** The exact output that rendered as a parse-error banner on /architecture. */
const BROKEN = `\`\`\`mermaid
graph TD
    A[Article Ingestion Service] -->|ingests articles|> B[Deduplication Service]
\`\`\``;

const VALID = `\`\`\`mermaid
graph TD
    A[Article Ingestion Service] -->|ingests articles| B[Deduplication Service]
\`\`\``;

/** Stub parser: rejects anything containing the `|>` defect. */
const stub = vi.fn(async (source: string) =>
  source.includes("|>") ? false : { diagramType: "flowchart-v2" },
);

describe("downgradeUnparseableDiagrams", () => {
  it("relabels a block the parser rejects", async () => {
    const result = await downgradeUnparseableDiagrams(BROKEN, stub);

    expect(result).toContain("```text");
    expect(result).not.toContain("```mermaid");
    // The source is still shown, just as code.
    expect(result).toContain("A[Article Ingestion Service]");
  });

  it("leaves a valid block alone", async () => {
    expect(await downgradeUnparseableDiagrams(VALID, stub)).toBe(VALID);
  });

  it("downgrades only the failing block in a mixed document", async () => {
    const doc = `# Design\n\n${VALID}\n\nAnd the other one:\n\n${BROKEN}\n`;

    const result = await downgradeUnparseableDiagrams(doc, stub);

    expect(result.match(/```mermaid/g)).toHaveLength(1);
    expect(result.match(/```text/g)).toHaveLength(1);
    expect(result).toContain("# Design");
    expect(result).toContain("And the other one:");
  });

  it("treats a parser that throws as a failed diagram", async () => {
    const thrower = vi.fn(async () => {
      throw new Error("boom");
    });

    expect(await downgradeUnparseableDiagrams(BROKEN, thrower)).toContain("```text");
  });

  it("never invokes the parser when there are no diagrams", async () => {
    const parser = vi.fn();
    const doc = "Just prose, and a ```python\nx = 1\n``` block.";

    expect(await downgradeUnparseableDiagrams(doc, parser)).toBe(doc);
    expect(parser).not.toHaveBeenCalled();
  });

  it("passes empty input straight through", async () => {
    expect(await downgradeUnparseableDiagrams("", stub)).toBe("");
  });
});

describe("downgradeUnparseableDiagrams with the real Mermaid parser", () => {
  it("agrees with Mermaid about which of the two diagrams renders", async () => {
    const doc = `${BROKEN}\n\n${VALID}\n`;

    const result = await downgradeUnparseableDiagrams(doc);

    // The broken one first, so ```text must precede ```mermaid.
    expect(result.indexOf("```text")).toBeLessThan(result.indexOf("```mermaid"));
    expect(result.match(/```mermaid/g)).toHaveLength(1);
  });
});
