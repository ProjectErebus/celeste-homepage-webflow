// Run: node --test tests/imo-lookup/imo.test.mjs
// Fixture vessels are SYNTHETIC (invented names/IMOs). Never put real snapshot data in this public repo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidImo, normName, buildIndex, lookup, eligibility } from '../../api/_lib/imo.js';

// valid check digits: 9919060 (sum 170), 9074729 (sum 7*9+6*0+5*7+4*4+3*7+2*2=63+0+35+16+21+4=139 -> 9)
const snap = {
  generated_at: '2026-11-06T00:00:00Z',
  vessels: [
    { imo: '9919060', name: 'TESTAROSA', type: 'Pleasure craft', loa_m: 69, flag: 'Cayman Islands', gt: 1240, mmsi: 319000001, lat: 1, lon: 2 },
    { imo: '9074729', name: 'M/Y Small Fry', type: 'Pleasure craft', loa_m: 37, flag: 'Malta', gt: 320 },
    { imo: null, name: 'NO IMO ONE', type: 'Sailing', loa_m: 30, flag: 'Norway', gt: null },
    { imo: null, name: 'Twin', type: 'Pleasure craft', loa_m: 40, flag: 'UK', gt: 400 },
    { imo: null, name: 'TWIN', type: 'Pleasure craft', loa_m: 41, flag: 'USA', gt: 410 },
  ],
};
const idx = buildIndex(snap);

test('check digit: accepts valid, rejects typo/short/non-numeric', () => {
  assert.equal(isValidImo('9919060'), true);
  assert.equal(isValidImo('IMO 9074729'), true);
  assert.equal(isValidImo('9919061'), false);
  assert.equal(isValidImo('991906'), false);
  assert.equal(isValidImo('abcdefg'), false);
  assert.equal(isValidImo(''), false);
});

test('name normalisation ignores prefixes, case, accents, punctuation', () => {
  assert.equal(normName('M/Y Small-Fry'), 'SMALL FRY');
  assert.equal(normName('  my  SMÁLL fry '), 'SMALL FRY');
});

test('IMO hit returns public fields only, never mmsi/position', () => {
  const r = lookup({ imo: '9919060' }, idx);
  assert.equal(r.status, 'found');
  assert.equal(r.vessel.name, 'TESTAROSA');
  assert.equal(r.eligibility, 'over_limit');
  const flat = JSON.stringify(r);
  for (const banned of ['mmsi', 'lat', 'lon', '319000001']) assert.equal(flat.includes(banned), false, banned);
});

test('GT boundary: 499 eligible, 500 over, null unknown', () => {
  assert.equal(eligibility(499), 'eligible');
  assert.equal(eligibility(500), 'over_limit');
  assert.equal(eligibility(null), 'unknown');
  assert.equal(eligibility(undefined), 'unknown');
});

test('under-limit yacht is eligible; unknown GT is unknown (never blank/0)', () => {
  assert.equal(lookup({ imo: '9074729' }, idx).eligibility, 'eligible');
  const r = lookup({ name: 'no imo one' }, idx);
  assert.equal(r.status, 'found');
  assert.equal(r.eligibility, 'unknown');
  assert.equal(r.vessel.gross_tonnage, null);
});

test('invalid check digit short-circuits', () => {
  assert.equal(lookup({ imo: '9919061' }, idx).status, 'invalid_imo');
});

test('valid IMO we do not hold -> not_found with imo_valid flag', () => {
  const r = lookup({ imo: '9074729'.replace('9074729', '9000009') }, idx);
  // 9000009: 63+0+0+0+0+0=63 -> 3, so 9000009 is invalid; use a constructed valid one
  assert.equal(r.status, 'invalid_imo');
  const valid = '9000003';
  assert.equal(isValidImo(valid), true);
  assert.deepEqual(lookup({ imo: valid }, idx), { status: 'not_found', imo_valid: true });
});

test('IMO + wrong name -> name_mismatch (still returns the vessel for the IMO)', () => {
  const r = lookup({ imo: '9919060', name: 'Something Else' }, idx);
  assert.equal(r.status, 'name_mismatch');
  assert.equal(r.vessel.imo, '9919060');
});

test('name only: single match, ambiguous list, no prefix enumeration', () => {
  assert.equal(lookup({ name: 'testarosa' }, idx).status, 'found');
  const amb = lookup({ name: 'twin' }, idx);
  assert.equal(amb.status, 'ambiguous');
  assert.equal(amb.candidates.length, 2);
  assert.equal(lookup({ name: 'testa' }, idx).status, 'not_found'); // no prefix match
});

test('empty / too-short input needs input', () => {
  assert.equal(lookup({}, idx).status, 'need_input');
  assert.equal(lookup({ name: 'ab' }, idx).status, 'need_input');
});

test('GT limit is configurable', () => {
  assert.equal(lookup({ imo: '9074729' }, idx, { gtLimit: 300 }).eligibility, 'over_limit');
});
