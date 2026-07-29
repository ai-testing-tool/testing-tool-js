#!/usr/bin/env node
/** Add @qa/test helpers to qa-* package unit tests. */
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

function migrate(content) {
  if (content.includes("@qa/test")) return content;

  let out = content
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*'vitest';?\n/g,
      (match, imports) => {
        const names = imports.split(',').map((s) => s.trim());
        const kept = names.filter((n) => !['describe', 'it', 'test'].includes(n.split(/\s+as\s+/)[0]));
        const qaImports = "import { qaDescribe, qaItAuto, expect } from '@qa/test';\n";
        if (kept.length === 0) return qaImports;
        const vitestImport = kept.length
          ? `import { ${kept.join(', ')} } from 'vitest';\n`
          : '';
        return `${qaImports}${vitestImport}`;
      },
    )
    .replace(/\bdescribe\(/g, 'qaDescribe(')
    .replace(/\bit\(/g, 'qaItAuto(')
    .replace(/\bit\.skip\(/g, 'qaItAuto.skip(')
    .replace(/\bit\.only\(/g, 'qaItAuto.only(');

  if (!out.includes("from '@qa/test'")) {
    out = "import { qaDescribe, qaItAuto, expect } from '@qa/test';\n" + out;
  }

  return out;
}

for (const entry of readdirSync(root)) {
  if (!entry.startsWith('qa-')) continue;
  const testsDir = path.join(root, entry, 'src', '__tests__');
  let files = [];
  try {
    collectTests(testsDir, files);
  } catch {
    continue;
  }
  for (const file of files) {
    const next = migrate(readFileSync(file, 'utf8'));
    writeFileSync(file, next);
    console.log('updated', path.relative(root, file));
  }
}
