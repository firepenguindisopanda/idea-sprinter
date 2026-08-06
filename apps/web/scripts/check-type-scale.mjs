#!/usr/bin/env node
/**
 * Fails lint when type drifts off the ladder.
 *
 * Guards four things: no arbitrary font sizes, tracking limited to three
 * values, two font weights, and no hand-typed mono labels where .label-* exists.
 * Vendored components/ui/ is exempt.
 *
 * Usage:  node scripts/check-type-scale.mjs [--summary]
 */
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;

/** The ladder. Anything outside these sets is a violation. */
const ALLOWED_SIZE = new Set([
  "text-xs", "text-sm", "text-base", "text-lg",
  "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl",
]);

/** Three tracking values: headings, default, mono labels. */
const ALLOWED_TRACKING = new Set(["tracking-tight", "tracking-normal", "tracking-widest"]);

/** Two weights for UI work; nothing below 400. */
const ALLOWED_WEIGHT = new Set(["font-normal", "font-medium", "font-bold"]);

const RULES = [
  {
    id: "arbitrary-size",
    re: /\btext-\[[^\]]*(?:px|rem|em)\]/g,
    msg: "arbitrary font size - use the ladder (text-xs .. text-6xl) or a .label-* class",
  },
  {
    id: "size-off-ladder",
    re: /\btext-(?:7xl|8xl|9xl)\b/g,
    msg: "font size above the ladder",
  },
  {
    id: "tracking",
    re: /\btracking-(?:\[[^\]]*\]|tighter|wide|wider)\b/g,
    msg: `tracking outside the allowed set (${[...ALLOWED_TRACKING].join(", ")})`,
  },
  {
    id: "weight",
    re: /\bfont-(?:thin|extralight|light|semibold|extrabold|black)\b/g,
    msg: `font weight outside the allowed set (${[...ALLOWED_WEIGHT].join(", ")})`,
  },
  {
    id: "hand-typed-label",
    // The `font-mono ... uppercase ... tracking-*` string that .label-sm and
    // .label-xs exist to replace. Matched loosely: the three signals in any order
    re: /className=(?:"|\{`|'|\{")(?=[^"`'}]*\bfont-mono\b)(?=[^"`'}]*\buppercase\b)(?=[^"`'}]*\btracking-)[^"`'}]*/g,
    msg: "hand-typed mono label - use .label-sm / .label-xs",
  },
];

/** UI primitives are vendored from shadcn; they get migrated deliberately, not swept. */
const EXEMPT = [/\/components\/ui\//];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = (await walk(SRC)).filter((f) => !EXEMPT.some((re) => re.test(f)));
const summaryOnly = process.argv.includes("--summary");

const byRule = new Map(RULES.map((r) => [r.id, []]));

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const line = text.slice(0, m.index).split("\n").length;
      byRule.get(rule.id).push({
        file: relative(SRC, file),
        line,
        match: m[0].length > 60 ? `${m[0].slice(0, 57)}...` : m[0],
        rule,
      });
    }
  }
}

let total = 0;
for (const rule of RULES) {
  const hits = byRule.get(rule.id);
  total += hits.length;
  if (!hits.length) continue;
  console.log(`\n${rule.id}  (${hits.length})  - ${rule.msg}`);
  if (summaryOnly) {
    const perFile = hits.reduce((a, h) => ((a[h.file] = (a[h.file] || 0) + 1), a), {});
    for (const [f, n] of Object.entries(perFile).sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      console.log(`   ${String(n).padStart(4)}  ${f}`);
    }
    const rest = Object.keys(perFile).length - 8;
    if (rest > 0) console.log(`         ... and ${rest} more files`);
  } else {
    for (const h of hits) console.log(`   src/${h.file}:${h.line}  ${h.match}`);
  }
}

console.log(`\n${total === 0 ? "PASS" : "FAIL"}  ${total} violation(s) across ${files.length} files`);
process.exit(total === 0 ? 0 : 1);
