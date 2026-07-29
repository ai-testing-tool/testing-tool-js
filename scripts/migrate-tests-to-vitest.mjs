#!/usr/bin/env node
/**
 * One-shot migration: node:test + node:assert → vitest expect API.
 * Safe to re-run (skips files already using vitest).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectTests(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      collectTests(full, out);
    } else if (entry.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
}

const files = [];
for (const entry of readdirSync(root)) {
  if (!entry.startsWith('qa-')) continue;
  const testsDir = path.join(root, entry, 'src', '__tests__');
  try {
    collectTests(testsDir, files);
  } catch {
    // package has no tests yet
  }
}

function splitCallArgs(inner) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    if (ch === ',' && depth === 0) {
      return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
    }
  }
  return [inner.trim(), ''];
}

function replaceAssertCalls(source, method, replacer) {
  const needle = `assert.${method}(`;
  let out = '';
  let cursor = 0;

  while (cursor < source.length) {
    const idx = source.indexOf(needle, cursor);
    if (idx === -1) {
      out += source.slice(cursor);
      break;
    }

    out += source.slice(cursor, idx);
    let i = idx + needle.length;
    let depth = 1;
    let quote = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (quote) {
        if (ch === '\\') {
          i += 2;
          continue;
        }
        if (ch === quote) quote = null;
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        i += 1;
        continue;
      }
      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;
      i += 1;
    }

    const inner = source.slice(idx + needle.length, i - 1);
    out += replacer(inner);
    cursor = i;
  }

  return out;
}

function migrateFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  if (content.includes("from 'vitest'")) {
    return false;
  }

  content = content.replace(/import assert from 'node:assert\/strict';\n/g, '');
  content = content.replace(
    /import \{ describe, it \} from 'node:test';\n/g,
    "import { describe, it, expect } from 'vitest';\n",
  );

  content = replaceAssertCalls(content, 'deepEqual', (inner) => {
    const [left, right] = splitCallArgs(inner);
    return `expect(${left}).toEqual(${right})`;
  });
  content = replaceAssertCalls(content, 'equal', (inner) => {
    const [left, right] = splitCallArgs(inner);
    return `expect(${left}).toBe(${right})`;
  });
  content = replaceAssertCalls(content, 'notEqual', (inner) => {
    const [left, right] = splitCallArgs(inner);
    return `expect(${left}).not.toBe(${right})`;
  });
  content = replaceAssertCalls(content, 'ok', (inner) => `expect(${inner.trim()}).toBeTruthy()`);
  content = replaceAssertCalls(content, 'match', (inner) => {
    const [left, right] = splitCallArgs(inner);
    return `expect(${left}).toMatch(${right})`;
  });
  content = replaceAssertCalls(content, 'throws', (inner) => {
    const [fn, err] = splitCallArgs(inner);
    return `expect(${fn.trim()}).toThrow(${err})`;
  });

  writeFileSync(filePath, content);
  return true;
}

let migrated = 0;
for (const filePath of files) {
  if (migrateFile(filePath)) {
    migrated += 1;
    console.log('migrated', path.relative(root, filePath));
  }
}
console.log(`Done: ${migrated} file(s).`);
