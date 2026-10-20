// lib/jsonld.mjs — builds the ONE schema.org @graph for a blog post, derived from the
// rendered page itself (H1, FAQ, <img>) so structured data can never drift from visible text.
// Entities (Organization, WebSite) are defined once on the homepage; we only reference them by @id.
// Node stdlib only. Spec: schema01/SPEC.md.

const ORIGIN = 'https://celeste7.ai';
export const ORG = { '@id': `${ORIGIN}/#organization` };
export const WEBSITE = { '@id': `${ORIGIN}/#website` };
export const FALLBACK_IMAGE = `${ORIGIN}/og-hero.jpg`;

export function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
    .replace(/&rarr;/g, '\u2192').replace(/&amp;/g, '&');
}
export const textOf = (html) =>
  decodeEntities(String(html).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<\/?(p|li|ul|ol|div|br|h[1-6]|tr|td|th|table|figure|figcaption)\b[^>]*>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// Visible FAQ: every <div class="faq"> = alternating <h3> question + one or more <p>/<ul> answer blocks.
export function extractFaq(html) {
  const out = [];
  const re = /<div class="faq">([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    const parts = m[1].split(/<h3[^>]*>/i).slice(1);
    for (const part of parts) {
      const [q, ...rest] = part.split(/<\/h3>/i);
      const name = textOf(q), text = textOf(rest.join(''));
      if (name && text) out.push({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } });
    }
  }
  return out;
}

export function absUrl(u) {
  return /^https?:\/\//.test(u) ? u : ORIGIN + (u.startsWith('/') ? '' : '/') + u;
}

// opts: { html, canonical, datePublished, dateModified, image (absolute url), keyword? }
export function buildGraph({ html, canonical, datePublished, dateModified, image, keyword }) {
  const h1 = textOf((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ''])[1]);
  const titleRaw = textOf((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]);
  const titleBare = titleRaw.replace(/\s+[\u2014-]\s+Celeste(OS)?$/, '');
  const headline = h1 && h1.length <= 110 ? h1 : titleBare;
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1]);
  const img = absUrl(image || FALLBACK_IMAGE);
  const id = (frag) => `${canonical}#${frag}`;
  const article = {
    '@type': 'BlogPosting', '@id': id('article'), headline, description,
    datePublished, dateModified: dateModified || datePublished,
    image: { '@type': 'ImageObject', '@id': id('primaryimage'), url: img, contentUrl: img },
    author: ORG, publisher: ORG,
    mainEntityOfPage: { '@id': id('webpage') }, isPartOf: WEBSITE, inLanguage: 'en',
  };
  if (keyword) article.keywords = keyword;
  const graph = [
    article,
    { '@type': 'WebPage', '@id': id('webpage'), url: canonical, name: headline, isPartOf: WEBSITE,
      breadcrumb: { '@id': id('breadcrumb') }, primaryImageOfPage: { '@id': id('primaryimage') }, inLanguage: 'en' },
    { '@type': 'BreadcrumbList', '@id': id('breadcrumb'), itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${ORIGIN}/blogs` },
      { '@type': 'ListItem', position: 3, name: headline, item: canonical } ] },
  ];
  const faq = extractFaq(html);
  if (faq.length) graph.push({ '@type': 'FAQPage', '@id': id('faq'), mainEntity: faq });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export const ldScript = (obj) =>
  `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, '\\u003c')}\n  </script>`;

// Replace every ld+json block in <head> with one block; fix brand + image meta tags.
export function applyToHtml(html, ld, image) {
  const blocks = /[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>[ \t]*\n?/g;
  let n = 0;
  html = html.replace(blocks, () => (n++ === 0 ? `  ${ldScript(ld)}\n` : ''));
  if (n === 0) html = html.replace('</head>', `  ${ldScript(ld)}\n</head>`);
  const img = absUrl(image);
  html = html
    .replace(/(<meta property="og:image" content=")[^"]*"/, `$1${img}"`)
    .replace(/(<meta name="twitter:image" content=")[^"]*"/, `$1${img}"`)
    .replace(/(<meta property="og:site_name" content=")Celeste"/, '$1CelesteOS"')
    .replace(/(<title>[\s\S]*?) \u2014 Celeste<\/title>/, '$1 \u2014 CelesteOS</title>')
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content="[^"]*?) \u2014 Celeste"/g, '$1 \u2014 CelesteOS"')
    .replace(/title="Celeste Blog"/, 'title="CelesteOS Blog"');
  return html;
}
