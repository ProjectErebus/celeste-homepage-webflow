// Vercel Function: yacht lookup by IMO and/or name. POST {imo?, name?} -> public particulars + GT eligibility.
// Reads a PRIVATE snapshot (this repo is public, so the data is never committed here).
//
// ENV (Vercel → Project → Settings → Environment Variables):
//   BLOB_STORE_ID       set by connecting the private Blob store "imo-snapshot" to the project (no secret needed)
//   IMO_SNAPSHOT_PATH   optional, default snapshot.json
//   IMO_GT_LIMIT        optional, default 500
//   (tests only) IMO_SNAPSHOT_URL / IMO_SNAPSHOT_TOKEN read the snapshot from a URL instead of the store
// Not configured or unreachable -> 503, and the caller treats the lead as "unverified" instead of failing.
// Returns particulars only. No MMSI, no position: owner security.

import { get } from '@vercel/blob';
import { buildIndex, lookup, GT_LIMIT_DEFAULT } from './_lib/imo.mjs';

const TTL_MS = 60 * 60 * 1000;
let cache = { at: 0, index: null };

async function readSnapshot() {
  // Production: private Blob store "imo-snapshot" (BLOB_STORE_ID, authenticated by Vercel's OIDC token: no secret).
  if (process.env.BLOB_STORE_ID) {
    const res = await get(process.env.IMO_SNAPSHOT_PATH || 'snapshot.json', { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200) throw new Error('snapshot blob not found');
    return new Response(res.stream).json();
  }
  // Tests / local: any URL, optional bearer token.
  const url = process.env.IMO_SNAPSHOT_URL;
  if (!url) return null;
  const headers = process.env.IMO_SNAPSHOT_TOKEN ? { Authorization: `Bearer ${process.env.IMO_SNAPSHOT_TOKEN}` } : {};
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`snapshot HTTP ${r.status}`);
  return r.json();
}

async function getIndex() {
  const now = Date.now();
  if (cache.index && now - cache.at < TTL_MS) return cache.index;
  try {
    const snap = await readSnapshot();
    if (!snap) return cache.index; // not configured: stale copy if we have one, else null
    if (!Array.isArray(snap.vessels) || snap.vessels.length < 100) throw new Error('snapshot looks empty');
    cache = { at: now, index: buildIndex(snap) };
  } catch (err) {
    console.error('[imo-lookup] snapshot load failed', err && err.message ? err.message : err);
  }
  return cache.index;
}

// Soft per-instance rate limit (30 / 10 min / IP). Stops casual scraping; not a security boundary.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 30;
}

const JSON_HEADERS = { 'Cache-Control': 'no-store' };
const reply = (body, status = 200) => Response.json(body, { status, headers: JSON_HEADERS });

export async function POST(request) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (limited(ip)) return reply({ error: 'rate_limited' }, 429);

  let body;
  try { body = await request.json(); } catch { body = null; }
  if (!body || typeof body !== 'object') return reply({ error: 'bad_request' }, 400);

  const index = await getIndex();
  if (!index) return reply({ error: 'lookup_unavailable' }, 503);

  const limit = Number(process.env.IMO_GT_LIMIT) || GT_LIMIT_DEFAULT;
  // observability without PII: status only
  const result = lookup({ imo: body.imo, name: body.name }, index, { gtLimit: limit });
  console.log('[imo-lookup]', { status: result.status, eligibility: result.eligibility || null });
  return reply({ ...result, snapshot_generated_at: index.generatedAt });
}
