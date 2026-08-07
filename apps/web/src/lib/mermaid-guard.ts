/**
 * Render-time guard for LLM-authored Mermaid.
 *
 * The backend repairs the diagrams it can and drops the ones it cannot, but it
 * uses a cheap structural check rather than Mermaid's own grammar, and older
 * rows were stored before that check existed. Whatever still slips through
 * gets rendered by Mermaid as a red "Parse error on line N" banner sitting
 * where the diagram should be - strictly worse than showing the source.
 *
 * So: parse each block with the real parser before enabling diagram rendering,
 * and relabel the ones that fail as plain code blocks.
 */

/** Cheap pre-check, so documents with no diagrams never load the parser. */
const HAS_MERMAID_RE = /^[ \t]*`{3,}[ \t]*mermaid[ \t]*$/im;

/**
 * A fenced ```mermaid block. The backreferences keep the closing fence tied to
 * the opening one, so a diagram containing backticks cannot end the block
 * early.
 */
function mermaidFenceRe(): RegExp {
  return /^([ \t]*)(`{3,})[ \t]*mermaid[ \t]*\r?\n([\s\S]*?)^\1\2[ \t]*$/gim;
}

/** Parses a diagram, resolving false when it is invalid. */
export type MermaidParser = (source: string) => Promise<unknown>;

let cachedParser: Promise<MermaidParser> | null = null;

function defaultParser(): Promise<MermaidParser> {
  cachedParser ??= import("mermaid").then(
    (mod) => (source: string) =>
      // suppressErrors makes an invalid diagram resolve to `false` instead of
      // throwing, which is the distinction we care about here.
      mod.default.parse(source, { suppressErrors: true }),
  );
  return cachedParser;
}

/**
 * Replace every ```mermaid block that will not parse with a plain code block.
 *
 * Returns the markdown unchanged when every diagram is valid (or there are
 * none), so the common case allocates nothing.
 */
export async function downgradeUnparseableDiagrams(
  markdown: string,
  parser?: MermaidParser,
): Promise<string> {
  if (!markdown || !HAS_MERMAID_RE.test(markdown)) return markdown;

  const blocks = [...markdown.matchAll(mermaidFenceRe())];
  if (blocks.length === 0) return markdown;

  const parse = parser ?? (await defaultParser());
  const valid = await Promise.all(
    blocks.map(async (block) => {
      try {
        return (await parse(block[3])) !== false;
      } catch {
        return false;
      }
    }),
  );

  if (valid.every(Boolean)) return markdown;

  let result = "";
  let cursor = 0;
  blocks.forEach((block, index) => {
    const start = block.index ?? 0;
    result += markdown.slice(cursor, start);
    // The info string is the first `mermaid` in the block, on the fence line.
    result += valid[index] ? block[0] : block[0].replace(/mermaid/i, "text");
    cursor = start + block[0].length;
  });

  return result + markdown.slice(cursor);
}
