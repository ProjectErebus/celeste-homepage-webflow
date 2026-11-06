// IMO / yacht-name lookup core. Pure functions: no network, no env, so it is testable offline.
// Privacy rule: results carry public particulars only. NEVER add mmsi, position or last-seen fields.

export const GT_LIMIT_DEFAULT = 500;

/** IMO numbers carry a check digit: weights 7,6,5,4,3,2 on the first six digits; sum % 10 must equal digit 7. */
export function isValidImo(value) {
  const s = String(value ?? '').replace(/^IMO\s*/i, '').trim();
  if (!/^\d{7}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 6; i++) sum += Number(s[i]) * (7 - i);
  return sum % 10 === Number(s[6]);
}

export function cleanImo(value) {
  return String(value ?? '').replace(/^IMO\s*/i, '').replace(/\s+/g, '').trim();
}

/** Upper-case, strip accents, drop vessel prefixes (M/Y, S/Y, MV...), punctuation and spacing. */
export function normName(value) {
  return String(value ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\b(M\/Y|S\/Y|M\.Y\.|S\.Y\.|MY|SY|MV|MS|YACHT)\b/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

/** Build lookup indexes once per snapshot. */
export function buildIndex(snapshot) {
  const byImo = new Map();
  const byName = new Map();
  for (const v of snapshot.vessels || []) {
    if (v.imo) byImo.set(String(v.imo), v);
    const n = normName(v.name);
    if (n.length >= 2) {
      if (!byName.has(n)) byName.set(n, []);
      byName.get(n).push(v);
    }
  }
  return { byImo, byName, generatedAt: snapshot.generated_at || null };
}

/** Whitelist the public fields. Anything not listed here can never leave the server. */
function publicVessel(v) {
  return {
    imo: v.imo ? String(v.imo) : null,
    name: v.name ?? null,
    type: v.type ?? null,
    length_m: v.loa_m ?? null,
    flag: v.flag ?? null,
    gross_tonnage: v.gt ?? null,
  };
}

export function eligibility(gt, limit = GT_LIMIT_DEFAULT) {
  if (gt === null || gt === undefined || Number.isNaN(Number(gt))) return 'unknown';
  return Number(gt) >= limit ? 'over_limit' : 'eligible';
}

/**
 * lookup({imo, name}, index, {gtLimit})
 * status: invalid_imo | found | name_mismatch | ambiguous | not_found | need_input
 * Exact matches only (IMO, or normalised full name). No prefix search, so the list cannot be enumerated.
 */
export function lookup(input, index, opts = {}) {
  const limit = opts.gtLimit ?? GT_LIMIT_DEFAULT;
  const imo = cleanImo(input?.imo);
  const name = String(input?.name ?? '').trim().slice(0, 80);
  const nName = normName(name);

  if (!imo && nName.length < 3) return { status: 'need_input' };

  if (imo) {
    if (!isValidImo(imo)) return { status: 'invalid_imo' };
    const v = index.byImo.get(imo);
    if (v) {
      const nameMatches = nName ? normName(v.name) === nName : null;
      return {
        status: nameMatches === false ? 'name_mismatch' : 'found',
        vessel: publicVessel(v),
        eligibility: eligibility(v.gt, limit),
        name_matches: nameMatches,
      };
    }
    // valid IMO we do not hold: fall through to a name search if a name was given
    if (!nName) return { status: 'not_found', imo_valid: true };
  }

  const hits = index.byName.get(nName) || [];
  if (hits.length === 1) {
    return { status: 'found', vessel: publicVessel(hits[0]), eligibility: eligibility(hits[0].gt, limit), name_matches: true };
  }
  if (hits.length > 1) {
    return { status: 'ambiguous', candidates: hits.slice(0, 5).map(publicVessel) };
  }
  return { status: 'not_found', imo_valid: imo ? true : null };
}
