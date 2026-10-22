// Fails if the cookie banner (js/cookie-consent.js, which embeds its own CSS) drifts from the product datum:
// raw hex colours outside var(), radius > 4px, or first-person company voice. No dependencies.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'cookie-consent.js');
const src = readFileSync(file, 'utf8');
const fails = [];
// Remove every var(...) call, including nested parentheses such as var(--x,rgba(0,0,0,.1)).
function stripVar(line) {
  let out = '';
  for (let i = 0; i < line.length; i++) {
    if (line.startsWith('var(', i)) {
      let depth = 0;
      for (; i < line.length; i++) {
        if (line[i] === '(') depth++;
        else if (line[i] === ')' && --depth === 0) break;
      }
    } else out += line[i];
  }
  return out;
}
const lines = src.split('\n');

// Only the CSS string array and the UI markup are checked (ids such as G-… are not colours).
const start = lines.findIndex((l) => l.includes('var CSS = ['));
const end = lines.findIndex((l, i) => i > start && l.includes("].join('')"));
if (start < 0 || end < 0) fails.push('cannot locate CSS block in js/cookie-consent.js');

for (let i = start; i <= end && start >= 0; i++) {
  const stripped = stripVar(lines[i]); // colours inside var(--x, fallback) are allowed
  const hex = stripped.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (hex) fails.push(`line ${i + 1}: hex colour outside var(): ${hex.join(' ')}`);
  if (/\brgba?\(/.test(stripped)) fails.push(`line ${i + 1}: raw rgb()/rgba() colour outside var()`);
  for (const m of stripped.matchAll(/border-radius:\s*([^;'}]+)/g)) {
    for (const v of m[1].match(/[\d.]+(?:px|rem|em)/g) || []) {
      const n = parseFloat(v);
      const px = /px$/.test(v) ? n : n * 16;
      if (px > 4) fails.push(`line ${i + 1}: radius ${v} > 4px`);
    }
  }
}
for (const phrase of ['We use', 'our ads', 'our advertising', 'we may use']) {
  lines.forEach((l, i) => { if (l.includes(phrase)) fails.push(`line ${i + 1}: first-person copy "${phrase}"`); });
}

if (fails.length) { console.error('FAIL cookie_banner_check\n' + fails.join('\n')); process.exit(1); }
console.log('PASS cookie_banner_check');
