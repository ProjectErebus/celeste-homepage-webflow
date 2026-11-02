// lib/post-lastmod.mjs — a blog post's real last CONTENT change, from git history.
//
// `git log -1 --format=%cI -- blogs/<slug>.html` alone is not enough: site-wide chrome commits (nav, footer,
// booking link, tracking scripts, JSON-LD) touch every post at once and would stamp the same date on all of them.
// So we walk the post's history newest-first and return the committer date (%cI) of the newest commit whose
// ARTICLE TEXT differs from its parent's. Article text = the visible text inside <article>…</article>, without the
// article CTA blocks and the "Read next" nav (chrome that is edited site-wide). Markup-only edits (hrefs, classes,
// scripts, <head>, JSON-LD) are therefore not content changes; a changed word in the post is.
//
// Node stdlib + git only. Returns null when the file is not tracked (caller falls back).
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { textOf } from './jsonld.mjs';

export function articleText(html) {
  const m = String(html).match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const body = m ? m[1] : String(html).split(/<\/head>/i).pop();
  return textOf(
    body
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<div class="article-cta">[\s\S]*?<\/div>/gi, '')
      .replace(/<nav\b[\s\S]*?<\/nav>/gi, ''),
  );
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}
function show(root, rev, rel) {
  try { return git(root, ['show', `${rev}:${rel}`]); } catch { return null; }
}

// rel = path relative to the repo root, e.g. 'blogs/audit-trail-superyacht.html'.
// Returns { date: '<%cI>', sha } | { date: null, uncommitted: true } | null.
export function postContentLastmod(root, rel) {
  let log;
  try { log = git(root, ['log', '--format=%H %cI', '--', rel]).trim(); } catch { return null; }
  if (!log) return null; // untracked / never committed
  // Uncommitted content edits in the working tree: the real change is "now"; let the caller decide.
  const wt = existsSync(join(root, rel)) ? readFileSync(join(root, rel), 'utf8') : null;
  const head = show(root, 'HEAD', rel);
  if (wt !== null && head !== null && articleText(wt) !== articleText(head)) return { date: null, uncommitted: true };
  const rows = log.split('\n').map((l) => l.split(' '));
  for (const [sha, date] of rows) {
    const cur = show(root, sha, rel);
    const prev = show(root, `${sha}^`, rel);
    if (cur === null) continue; // the commit deleted the file
    if (prev === null || articleText(cur) !== articleText(prev)) return { date, sha };
  }
  const [sha, date] = rows[rows.length - 1];
  return { date, sha };
}
