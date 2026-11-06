/* Mock of booking-api-contract.md v1 for Playwright (route interception, no network, no server).
 *   const mock = createMock({ mode: 'ok' | 'slot_taken' | 'booking_disabled' | 'rate_limited' | 'graph_unavailable' });
 *   await mock.install(page);          // page loads /book?api=http://mock.test
 * mock.calls holds every request seen (method, path, body) so tests assert on what the page SENT.
 * Behaviour switches: mock.mode applies to POST /api/book; mock.slotsMode ('ok'|'booking_disabled') to GET slots.
 */
export const API = 'http://mock.test';

export function makeSlots(days = 3) {
  const slots = [];
  const base = new Date(); base.setUTCHours(0, 0, 0, 0);
  for (let d = 2; d < 2 + days; d++) {
    for (const h of [9, 10, 14]) {
      const s = new Date(base.getTime() + d * 864e5 + h * 36e5);
      slots.push({ start: s.toISOString().replace('.000', ''), end: new Date(s.getTime() + 18e5).toISOString().replace('.000', '') });
    }
  }
  return slots;
}

export function createMock(opts = {}) {
  const state = {
    mode: opts.mode || 'ok',
    slotsMode: opts.slotsMode || 'ok',
    token: opts.token || 'goodtoken',
    calls: [],
    slots: makeSlots(),
    taken: new Set(),
    cancelled: false,
    appts: {},
  };
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
  const json = (route, status, body) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });

  state.install = async (page) => {
    await page.route(API + '/**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      let body = null;
      try { body = req.postDataJSON(); } catch {}
      state.calls.push({ method: req.method(), path, search: url.search, body });

      if (req.method() === 'GET' && path === '/api/book/slots') {
        if (state.slotsMode === 'booking_disabled') return json(route, 503, { error: 'booking_disabled' });
        const free = state.slots.filter((s) => !state.taken.has(s.start));
        return json(route, 200, { timezone: 'America/New_York', slotMinutes: 30, generatedAt: new Date().toISOString(), dryRun: true, slots: free });
      }
      if (req.method() === 'POST' && path === '/api/book') {
        if (state.mode === 'slot_taken') { state.taken.add(body.slotStart); return json(route, 409, { error: 'slot_taken' }); }
        if (['booking_disabled', 'graph_unavailable'].includes(state.mode)) return json(route, 503, { error: state.mode });
        if (state.mode === 'rate_limited') return json(route, 429, { error: 'rate_limited' });
        if (body.website) return json(route, 400, { error: 'invalid' });
        const id = 'cb_test1';
        state.appts[id] = body;
        return json(route, 201, {
          appointmentId: id, start: body.slotStart, end: new Date(Date.parse(body.slotStart) + 18e5).toISOString(),
          joinUrl: state.noJoin ? null : 'https://teams.microsoft.com/l/meetup-join/mock',
          manageUrl: `https://celeste7.ai/book/manage?id=${id}&t=${state.token}`, dryRun: true,
        });
      }
      const m = path.match(/^\/api\/book\/([^/]+)\/(cancel|reschedule)$/);
      if (req.method() === 'POST' && m) {
        if (body.token !== state.token) return json(route, 403, { error: 'bad_token' });
        if (m[1] === 'missing') return json(route, 404, { error: 'not_found' });
        if (state.cancelled) return json(route, 410, { error: 'already_cancelled' });
        if (m[2] === 'cancel') { state.cancelled = true; return json(route, 200, { cancelled: true }); }
        if (state.taken.has(body.slotStart)) return json(route, 409, { error: 'slot_taken' });
        return json(route, 200, { start: body.slotStart, end: new Date(Date.parse(body.slotStart) + 18e5).toISOString(), manageUrl: `https://celeste7.ai/book/manage?id=${m[1]}&t=${state.token}` });
      }
      return json(route, 404, { error: 'not_found' });
    });
  };
  return state;
}
