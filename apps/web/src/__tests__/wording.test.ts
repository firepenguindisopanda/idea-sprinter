import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * The product's names in user-visible text (revamp H2, from the approved
 * list `WORDING_2026-10-03.md`): "specs before code", a "design spec" - never
 * the old pipeline's "SRS" or "Software Requirements Specification", nor
 * "Workshop Studio".
 *
 * Comments are stripped first: they may name the old pipeline while they
 * explain what replaced it. The legacy pages are skipped; phase I removes
 * them, and their text goes with them.
 */
const ROOT = join(__dirname, '..');
const SCANNED = ['app', 'components'];
const LEGACY = ['app/generate', 'app/generator', 'app/ideation', 'components/generator'];
const BANNED = [/\bSRS\b/, /Software Requirements Specification/i, /Workshop Studio/i];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
  });
}

function withoutComments(source: string): string {
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // JSX comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/(^|[^:"'`])\/\/.*$/gm, '$1'); // line comments, not URLs
}

describe('wording', () => {
  it('names no SRS, Software Requirements Specification or Workshop Studio in user-visible text', () => {
    const found: string[] = [];
    for (const top of SCANNED) {
      for (const path of files(join(ROOT, top))) {
        const rel = relative(ROOT, path).split(sep).join('/');
        if (LEGACY.some((legacy) => rel.startsWith(`${legacy}/`))) continue;
        withoutComments(readFileSync(path, 'utf-8'))
          .split('\n')
          .forEach((line, i) => {
            if (BANNED.some((pattern) => pattern.test(line))) found.push(`${rel}:${i + 1}: ${line.trim()}`);
          });
      }
    }
    expect(found).toEqual([]);
  });
});
