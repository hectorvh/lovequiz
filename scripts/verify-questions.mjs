/**
 * Cross-checks src/data/questions.ts against the source markdown:
 * every language must agree on which option carries the ✅, and that position
 * must match the transcribed `correctIndex`.
 *
 * Run with: node scripts/verify-questions.mjs
 */
import { readFileSync } from 'node:fs';

const md = readFileSync('fernanda-questions-multilingual.md', 'utf8');
const ts = readFileSync('src/data/questions.ts', 'utf8');

const FLAGS = ['🇪🇸', '🇬🇧', '🇫🇷', '🇩🇪'];

// Markdown: collect the ✅ position per question, per language.
const expected = [];
let group = 0;
let current = null;

for (const line of md.split('\n')) {
  const groupMatch = line.match(/^## Grupo (\d)/);
  if (groupMatch) {
    group = Number(groupMatch[1]);
    continue;
  }
  if (/^### \d+$/.test(line) && group > 0) {
    current = { group, number: Number(line.slice(4)), perLang: [] };
    expected.push(current);
    continue;
  }
  if (!current) continue;

  const trimmed = line.trim();
  if (!trimmed.includes('|') || !FLAGS.some((f) => trimmed.startsWith(`- ${f}`))) {
    const options = trimmed.split(' | ');
    if (options.length === 4 && options.some((o) => o.includes('✅'))) {
      current.perLang.push(options.findIndex((o) => o.includes('✅')));
    }
  }
}

// TypeScript: ids and correctIndex values, in file order.
const actual = [...ts.matchAll(/id: '(g\dq\d)',\s*\n\s*correctIndex: (\d)/g)].map((m) => ({
  id: m[1],
  correctIndex: Number(m[2]),
}));

const problems = [];

if (expected.length !== 24) problems.push(`parsed ${expected.length} markdown questions, expected 24`);
if (actual.length !== 24) problems.push(`parsed ${actual.length} TS questions, expected 24`);

expected.forEach((q, i) => {
  const label = `g${q.group}q${q.number}`;

  if (q.perLang.length !== 4) {
    problems.push(`${label}: found ✅ in ${q.perLang.length}/4 languages`);
    return;
  }
  if (new Set(q.perLang).size !== 1) {
    problems.push(`${label}: languages disagree on the correct option (${q.perLang.join(', ')})`);
    return;
  }

  const row = actual[i];
  if (!row) {
    problems.push(`${label}: missing from questions.ts`);
    return;
  }
  if (row.id !== label) problems.push(`position ${i}: expected id ${label}, found ${row.id}`);
  if (row.correctIndex !== q.perLang[0]) {
    problems.push(
      `${label}: markdown says index ${q.perLang[0]}, questions.ts says ${row.correctIndex}`,
    );
  }
});

if (problems.length > 0) {
  console.error('MISMATCHES:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

console.log(`OK — all ${actual.length} questions match the markdown.`);
console.log(actual.map((a) => `${a.id}=${'ABCD'[a.correctIndex]}`).join('  '));
