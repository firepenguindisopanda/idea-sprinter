import { describe, expect, it } from "vitest";
import { buildSpecMarkdown, closeUnbalancedFence, openFence } from "@/lib/markdown-export";

/**
 * The workspace's markdown export joins every section into one file in the
 * browser, so the backend's fence fix in `assemble_srs` never reached it. A
 * fence one section leaves open swallows every section after it - headings,
 * tables and all - in whatever opens the file. These mirror the backend tests
 * (multi-agent-system `tests/test_assembler_fences.py`, HANDOFF §48).
 */

const OPEN = "```yaml\nopenapi: 3.0.0\npaths: {}\n";
const CLOSED = "```yaml\nopenapi: 3.0.0\n```\n";

describe("closeUnbalancedFence", () => {
  it("leaves a balanced section alone", () => {
    expect(closeUnbalancedFence(CLOSED)).toBe(CLOSED);
  });

  it("leaves a section with no fence alone", () => {
    expect(closeUnbalancedFence("- Unit tests.\n")).toBe("- Unit tests.\n");
  });

  it("closes an open fence at the end of its section", () => {
    expect(closeUnbalancedFence(OPEN)).toBe(`${OPEN}\`\`\`\n`);
  });

  it("adds a newline before the closer when the section lacks one", () => {
    expect(closeUnbalancedFence("```yaml\na: 1")).toBe("```yaml\na: 1\n```\n");
  });

  it("leaves a four-backtick block quoting a triple fence alone", () => {
    // How a model shows a markdown example: the inner line is content.
    const body = "````markdown\n```python\nprint(1)\n````\n\nAfter.\n";
    expect(closeUnbalancedFence(body)).toBe(body);
  });

  it("closes an open four-backtick block with four", () => {
    const body = "````markdown\n```python\nprint(1)\n```\n";
    expect(closeUnbalancedFence(body)).toBe(`${body}\`\`\`\`\n`);
  });

  it("closes an open tilde fence with tildes", () => {
    expect(closeUnbalancedFence("~~~yaml\nkey: value\n")).toBe("~~~yaml\nkey: value\n~~~\n");
  });

  it("does not treat a fence with an info string as a closer", () => {
    const body = "```yaml\na: 1\n```python\nprint(1)\n";
    expect(closeUnbalancedFence(body)).toBe(`${body}\`\`\`\n`);
  });

  it("drops a stray fence that ends the section instead of closing it", () => {
    // 22 recorded sections end this way; closing would leave an empty code box.
    const body = "```mermaid\ngraph TD\n```\n\n- Step one.\n";
    expect(closeUnbalancedFence(`${body}\`\`\`\`\n`)).toBe(body);
    expect(closeUnbalancedFence(`${body}\`\`\``)).toBe(body);
  });

  it("does not read inline triple backticks as a fence", () => {
    const body = "```inline``` is code, not a block.\n";
    expect(closeUnbalancedFence(body)).toBe(body);
  });
});

describe("buildSpecMarkdown", () => {
  const sections = [
    { title: "API", content: OPEN, order: 1 },
    { title: "Testing", content: "- Unit tests.\n", order: 2 },
  ];

  it("keeps the section after an open fence outside any code block", () => {
    const md = buildSpecMarkdown("Spec", sections);
    const [before, after] = md.split("## Testing");
    expect(after).toBeDefined();
    expect(openFence(before.split("\n"))).toBeNull();
    expect(after).toContain("- Unit tests.");
  });

  it("writes clean sections exactly as before", () => {
    const clean = [
      { title: "B", content: "second", order: 2 },
      { title: "A", content: "first", order: 1 },
      { title: "Empty", content: "", order: 3 },
    ];
    expect(buildSpecMarkdown("Spec", clean)).toBe(
      "# Spec\n\n## A\n\nfirst\n\n## B\n\nsecond\n",
    );
  });

  it("falls back to a default title", () => {
    expect(buildSpecMarkdown("", [])).toBe("# Design spec\n");
  });
});
