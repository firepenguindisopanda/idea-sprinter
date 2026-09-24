import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * The design checks `npm run lint` runs before ESLint.
 *
 * Both took their source directory from `new URL(...).pathname`, which on
 * Windows is `/C:/Users/...` and resolves to `C:\C:\Users\...` - so both
 * crashed with ENOENT and lint never reached ESLint. And the type-scale
 * check's exemption for the vendored `components/ui/` matched `/`-separated
 * paths only, so on Windows it exempted nothing.
 */

const WEB = join(__dirname, '..', '..');
const SRC = join(WEB, 'src');

function run(script: string, ...args: string[]) {
  return spawnSync(process.execPath, [join(WEB, 'scripts', script), ...args], {
    cwd: WEB,
    encoding: 'utf8',
  });
}

function sources(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name), pattern) : pattern.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe('design checks', () => {
  it('the type-scale check runs and reports a verdict', () => {
    const result = run('check-type-scale.mjs', '--summary');
    expect(result.stderr).not.toMatch(/ENOENT|Error/);
    expect(result.stdout).toMatch(/(PASS|FAIL) {2}\d+ violation\(s\) across \d+ files/);
  });

  it('the type-scale check exempts the vendored components/ui', () => {
    const all = sources(SRC, /\.tsx?$/);
    const vendored = all.filter((f) => relative(SRC, f).split(sep).join('/').startsWith('components/ui/'));
    expect(vendored.length).toBeGreaterThan(0);

    const result = run('check-type-scale.mjs', '--summary');
    const [, counted] = /across (\d+) files/.exec(result.stdout) ?? [];
    expect(Number(counted)).toBe(all.length - vendored.length);
    expect(result.stdout).not.toMatch(/components[\\/]ui[\\/]/);
  });

  it('the contrast check runs and reports a verdict', () => {
    const result = run('check-text-contrast.mjs', '--check');
    expect(result.stderr).not.toMatch(/ENOENT|Error/);
    expect(result.stdout).toMatch(/(PASS|FAIL) {2}\d+ text colour\(s\) below WCAG AA/);
  });
});
