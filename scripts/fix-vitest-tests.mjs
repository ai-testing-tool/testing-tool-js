#!/usr/bin/env node
/** Fix vitest migration leftovers in qa-* test files. */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectTests(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) collectTests(full, out);
    else if (entry.endsWith('.test.ts')) out.push(full);
  }
}

const files = [];
for (const entry of readdirSync(root)) {
  if (!entry.startsWith('qa-')) continue;
  const testsDir = path.join(root, entry, 'src', '__tests__');
  try {
    collectTests(testsDir, files);
  } catch {
    // no tests
  }
}

function fix(content) {
  let out = content;

  out = out.replace(/assert\.doesNotMatch\(([^,]+),\s*([^)]+)\)/g, 'expect($1).not.toMatch($2)');
  out = out.replace(
    /assert\.doesNotThrow\(\(\)\s*=>\s*\{([\s\S]*?)\}\s*,?\s*\);/g,
    'expect(() => {$1}).not.toThrow();',
  );

  out = out.replace(/\.toBe\(undefined\)/g, '.toBeUndefined()');
  out = out.replace(/\.toMatch\((\/[^/]+\/),\s*\)/g, '.toMatch($1)');
  out = out.replace(/\.toThrow\((\/[^/]+\/),\s*\)/g, '.toThrow($1)');
  out = out.replace(/\.toBe\((true|false),\s*\)/g, '.toBe($1)');

  // assert.ok(expr, 'msg') → expect(expr, 'msg').toBeTruthy() cleanup
  out = out.replace(
    /expect\(([\s\S]*?),\s*(?:'[^']*'|`[^`]*`)\s*,\s*\)\.toBeTruthy\(\)/g,
    'expect($1).toBeTruthy()',
  );

  // expect(expr, 'msg').toBe(false) cleanup
  out = out.replace(
    /expect\(([\s\S]*?),\s*(?:'[^']*'|`[^`]*`)\s*,\s*\)\.toBe\((true|false)\)/g,
    'expect($1).toBe($2)',
  );

  return out;
}

for (const file of files) {
  const next = fix(readFileSync(file, 'utf8'));
  if (next !== readFileSync(file, 'utf8')) {
    writeFileSync(file, next);
    console.log('fixed', path.relative(root, file));
  }
}
