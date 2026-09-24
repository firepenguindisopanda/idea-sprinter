#!/usr/bin/env node
/**
 * Fails lint when de-emphasised text falls below WCAG AA 4.5:1.
 *
 * Text hierarchy is three colours: text-foreground, text-muted-foreground, and
 * text-primary/80 for a de-emphasised accent. Lower alphas on text are what
 * this catches - text-primary/40 measures 2.01:1 on light.
 *
 * Icons and disabled controls are exempt: WCAG scores them differently, and a
 * disabled control's faded text is the affordance.
 *
 * Usage:  node scripts/check-text-contrast.mjs --check
 */
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Not `.pathname`: on Windows that is `/C:/...`, which resolves to `C:\C:\...`.
const SRC = fileURLToPath(new URL("../src", import.meta.url));

/** Uppercase JSX names that still render text rather than an icon. */
const TEXT_COMPONENTS = new Set([
  "Button", "Card", "CardHeader", "CardTitle", "CardContent", "CardDescription",
  "Badge", "Label", "DialogTitle", "DialogDescription", "AlertDialogTitle",
  "AlertDialogDescription", "TabsTrigger", "SelectTrigger", "SelectValue",
  "Markdown", "SheetTitle", "DropdownMenuLabel", "AlertDialogAction",
  "AlertDialogCancel", "Textarea", "Input",
]);

/** token -> replacement for any alpha at or below the listed ceiling. */
const FLOOR = {
  "muted-foreground": { ceiling: 90, to: "text-muted-foreground" },
  primary: { ceiling: 70, to: "text-primary/80" },
  destructive: { ceiling: 80, to: "text-destructive" },
  tertiary: { ceiling: 70, to: "text-tertiary" },
  warning: { ceiling: 80, to: "text-warning" },
};

// Captures any variant prefixes (placeholder:, hover:, dark:, group-hover:) so
// they survive the rewrite - `placeholder:text-muted-foreground/70` must stay a
// placeholder rule.
const CLASS_RE = /((?:[a-z-]+(?:\[[^\]]*\])?:)*)text-(muted-foreground|primary|destructive|tertiary|warning)\/(\d{1,3})\b/g;

function readAttrValue(s, i) {
  if (s[i] === '"' || s[i] === "'") {
    const q = s[i];
    const end = s.indexOf(q, i + 1);
    return end === -1 ? null : { start: i + 1, end };
  }
  if (s[i] === "{") {
    let depth = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}" && --depth === 0) return { start: i, end: j };
    }
  }
  return null;
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = await walk(SRC);
let edits = 0;
const byClass = {};

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const patches = [];
  for (const m of src.matchAll(/className\s*=\s*/g)) {
    const open = src.lastIndexOf("<", m.index);
    if (open === -1) continue;
    const el = /^<([A-Za-z][\w.]*)/.exec(src.slice(open));
    if (!el) continue;
    const name = el[1];
    const isIcon = /^[A-Z]/.test(name) && !TEXT_COMPONENTS.has(name);

    const v = readAttrValue(src, m.index + m[0].length);
    if (!v) continue;

    for (const c of src.slice(v.start, v.end).matchAll(CLASS_RE)) {
      const [full, variants, token, alphaStr] = c;
      const alpha = Number(alphaStr);
      const rule = FLOOR[token];
      if (!rule || alpha > rule.ceiling) continue;
      if (isIcon) continue;
      if (/(^|:)disabled:/.test(variants)) continue;
      const at = v.start + c.index;
      patches.push([at, at + full.length, variants + rule.to]);
      byClass[full] = (byClass[full] || 0) + 1;
    }
  }

  if (!patches.length) continue;
  edits += patches.length;
}

for (const [k, v] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(v).padStart(3)}  ${k}`);
}
console.log(`${edits === 0 ? "PASS" : "FAIL"}  ${edits} text colour(s) below WCAG AA 4.5:1`);
process.exit(edits === 0 ? 0 : 1);
