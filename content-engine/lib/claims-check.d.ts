// Types for lib/claims-check.mjs (spec 29 §2.5–§2.6).
export type Channel = 'blog' | 'page_meta' | 'email' | 'linkedin' | 'meta' | 'google_ads' | 'social_generic';
export type CheckId = 'CC01' | 'CC02' | 'CC03' | 'CC04' | 'CC05' | 'CC06' | 'CC07' | 'CC08' | 'CC09' | 'CC10' | 'CC11' | 'CC12';
export type CheckResult = 'pass' | 'fail' | 'warn' | 'not_applicable' | 'insufficient_evidence';

export interface Claim {
  claim_id: string;
  text: string;
  kind?: 'product_capability' | 'pricing' | 'regulatory' | 'comparative' | 'integration' | 'social_proof' | 'numeric' | 'factual' | string;
  location?: { field: string; start?: number; end?: number };
  support: { type: 'brand_pack' | 'evidence' | 'none'; ref?: string | null };
  status?: string;
}
export interface EvidenceItem { id: string; source_type: 'feed' | 'ledger_query' | 'repo_file' | 'public_url' | string; value?: string | number }
export interface ClaimsCheckInput {
  channel: Channel;
  fields: Record<string, string | string[]>;
  claim_provenance?: { claims: Claim[] };
  evidence?: EvidenceItem[];
  links?: string[];
  basis?: 'transactional' | 'relationship' | 'promotional';
  platform?: string;
  brand_pack?: { id: string; version: string; sha256: string };
}
export interface ReviewCheck { id: CheckId; result: CheckResult; details: string }
export interface Violation {
  id: CheckId; rule_id: string; severity: 'fail' | 'warn'; field: string; line: number; start: number; end: number;
  match: string; normalised: string; safe: string | null; negated?: boolean;
}
export interface ClaimsCheckResult {
  schema: 'claims-check-result/1.0.0';
  brand_pack: { id: string; version: string; sha256: string } | null;
  engine: { name: 'claims-check'; version: string; web_sha: string | null; module_sha256: string | null };
  channel: Channel | null;
  input_sha256: string;
  verdict: 'pass' | 'warn' | 'fail' | 'insufficient_evidence';
  checks: ReviewCheck[];
  violations: Violation[];
  claims: { claim_id: string | null; support_ref: string | null; result: 'supported' | 'unsupported' | 'text_differs' | 'wrong_channel'; details: string }[];
  unsupported_sentences: { field: string; start: number; end: number; text: string }[];
  limits: Record<string, unknown>[];
}
export interface Pack { id: string; version: string; sha256: string | null; [k: string]: unknown }
export class PackIntegrityError extends Error {}
export const CHANNELS: Channel[];
export const CHECK_IDS: CheckId[];
export function loadPack(opts?: { jsonPath?: string; mdPath?: string | null; expectSha256?: string }): Pack;
export function checkArtifact(input: ClaimsCheckInput, opts?: { pack?: Pack; legacy?: boolean; skip?: CheckId[]; web_sha?: string; assetIds?: string[] }): ClaimsCheckResult;
export function normalise(text: string, opts?: { html?: boolean; synonyms?: Record<string, string> }): { text: string; map: Int32Array };
export function exitCodeFor(res: ClaimsCheckResult): 0 | 1 | 3;
export function contentVerdict(res: ClaimsCheckResult): 'pass' | 'warn' | 'fail' | 'insufficient_evidence';
