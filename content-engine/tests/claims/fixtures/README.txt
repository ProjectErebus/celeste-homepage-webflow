page_meta_apostrophe_desc.html
  Expect: FAIL on meta description length (178 chars > 155). Title renders at 62 chars (&amp; = 1 char) and
  must PASS. Current gate.mjs:178 stops the description capture at the apostrophe in "vessel's" (27 chars)
  and so misses the length violation; gate.mjs:173 counts the raw "&amp;"/"&middot;" entities and so
  reports the title as too long. Both are structure-check bugs the extension fixes (decode entities,
  quote-aware attribute parse).
