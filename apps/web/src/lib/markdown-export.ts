/**
 * The workspace's markdown export: every section joined into one file.
 *
 * Joining is where a model's unclosed code fence does its damage. In the app
 * each section renders on its own, so an open fence ends with its section; in
 * one file it swallows every section after it - headings, tables and all - in
 * whatever opens the download. The backend closes these in `assemble_srs`, but
 * this file is built here and never passes through it, so the same fix is
 * ported here (multi-agent-system `app/core/srs_assembler.py`, HANDOFF §48).
 */

export interface ExportSection {
  title: string;
  content: string;
  order: number;
}

const FENCE_RE = /^(`{3,}|~{3,})(.*)$/;

/**
 * The fence still open after `lines`, and the line that opened it, as a
 * markdown renderer sees it - or null when every fence is closed.
 *
 * A fence closes only on a line of its own character, at least as long, with
 * nothing after it; any other fence-like line inside it is content. A backtick
 * opener's info string cannot hold a backtick, so ```x``` is inline code.
 */
export function openFence(lines: string[]): { fence: string; line: number } | null {
  let open: { fence: string; line: number } | null = null;
  for (let i = 0; i < lines.length; i++) {
    const match = FENCE_RE.exec(lines[i].trim());
    if (!match) continue;
    const [, run, rest] = match;
    if (open === null) {
      if (!(run[0] === "`" && rest.includes("`"))) open = { fence: run, line: i };
    } else if (run[0] === open.fence[0] && run.length >= open.fence.length && !rest.trim()) {
      open = null;
    }
  }
  return open;
}

/**
 * Close a code fence a section left open, at the end of that section.
 *
 * A stray opener with nothing after it - 22 recorded sections end in a lone
 * ```` or ``` line - is dropped instead, so it leaves no empty code box.
 */
export function closeUnbalancedFence(content: string): string {
  const lines = content.split("\n");
  const open = openFence(lines);
  if (open === null) return content;
  if (!lines.slice(open.line + 1).join("").trim()) {
    return `${lines.slice(0, open.line).join("\n").replace(/\n+$/, "")}\n`;
  }
  return `${content.endsWith("\n") ? content : `${content}\n`}${open.fence}\n`;
}

/** The whole document as one markdown file, sections in order. */
export function buildSpecMarkdown(title: string, sections: ExportSection[]): string {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const lines: string[] = [`# ${title || "Specification Document"}\n`];
  for (const section of sorted) {
    if (section.content) {
      lines.push(`## ${section.title}\n`);
      lines.push(`${closeUnbalancedFence(section.content)}\n`);
    }
  }
  return lines.join("\n");
}
