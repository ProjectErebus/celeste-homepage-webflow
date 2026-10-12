/**
 * SeaNet pages visibility switch.
 *
 * Every /seanet* page returns 404 unless the Vercel environment variable SEANET_VISIBLE is exactly "true".
 * Unset, "false", or anything else = hidden. Changing the variable needs a redeploy.
 *
 * The original SeaNet Co pages (overview, proposal, security pitch) are retired and always 404;
 * /seanet itself redirects to the current M/Y Euphoria pages. The security companion stays live.
 */
export const config = {
  matcher: ['/:page(seanet[^/]*)'],
};

const RETIRED = /^\/(seanet-overview|seanet-proposal|seanet-security)(\.html)?$/i;
const OLD_HOME = /^\/seanet(\.html)?$/i;

const NOT_FOUND = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0C0B0A;color:rgba(255,255,255,0.7);font-family:system-ui,-apple-system,sans-serif"><p>Page not found.</p></body></html>';

function notFound() {
  return new Response(NOT_FOUND, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-store' },
  });
}

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;
  if (!/^\/seanet[^/]*$/i.test(pathname)) return;

  const flag = (process.env.SEANET_VISIBLE ?? '').trim().toLowerCase();
  if (flag !== 'true') return notFound();

  if (RETIRED.test(pathname)) return notFound();
  if (OLD_HOME.test(pathname)) return Response.redirect(new URL('/seanet-euphoria', url), 307);
}
