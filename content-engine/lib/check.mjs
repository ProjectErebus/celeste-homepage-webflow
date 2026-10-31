// lib/check.mjs — the blog gate's legacy view of the claims check (spec 29 §2.2 step 7).
// Pure, importable (no process.exit). gate.mjs prints these; the Control worker can import them.
//
//   checkText(text, { fullPage, pack?, field? }) → [{ sev: 'FAIL'|'WARN', line, rule, quote, safe, check, rule_id }]
//
// It is checkArtifact() on channel "blog" with CC05/CC06 not applicable (no provenance in
// the blog flow), mapped to the human report gate.mjs has always printed.
import { checkArtifact, loadPack } from './claims-check.mjs';

const LABEL = { CC01: 'banned lexicon', CC02: 'banned overclaim', CC03: 'call-only', CC04: 'banned host/name', CC08: 'structure', CC09: 'unbound asset placeholder' };

export function legacyView(res, pack) {
  const fam = new Map((pack?.rules || []).map(r => [r.id, r.family]));
  return res.violations.map(v => {
    let rule;
    if (v.rule_id === 'INT') rule = 'internal code/file name';
    else if (v.rule_id === 'U15') rule = 'dead host U15';
    else if (v.id === 'CC08') rule = 'structure';
    else if (v.id === 'CC09') rule = 'unbound asset placeholder';
    else rule = `${LABEL[v.id] || v.id} ${v.rule_id}${fam.get(v.rule_id) ? ` (${fam.get(v.rule_id)})` : ''}${v.negated ? ' [negated]' : ''}`;
    return { sev: v.severity === 'fail' ? 'FAIL' : 'WARN', line: v.line, rule, quote: String(v.match).replace(/\s+/g, ' ').slice(0, 80), safe: v.safe || null, check: v.id, rule_id: v.rule_id, field: v.field };
  });
}

export function checkText(text, { fullPage = false, pack, field } = {}) {
  pack = pack || loadPack();
  const f = field || (fullPage ? 'page_html' : 'draft_html');
  const res = checkArtifact({ channel: 'blog', fields: { [f]: text } }, { pack, legacy: true });
  return legacyView(res, pack);
}
