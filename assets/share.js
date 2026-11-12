/* Share links.
 *
 * A link carries the whole form in the URL fragment: #card=<data> or
 * #jd=<data>. Browsers never send the fragment to a server, and the page
 * loads no third-party scripts that could read it, so the answers only go
 * where the person sends the link.
 *
 * The data is the raw form, not the rendered text: option keys rather than
 * their labels, so the reader can switch language and still get a correct
 * document. Anything read back from a link is untrusted, and is checked
 * against the document's own field list before it reaches the form.
 */
'use strict';

const MAX_LINK_DATA = 20000;   // characters of encoded data we accept
const MAX_FIELD_TEXT = 2000;   // per text field
const MAX_ROW_TEXT = 200;      // per cell in a row list

function encodeShare(data){
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The decoded object, or null if the text is not something we wrote. */
function decodeShare(text){
  if(typeof text !== 'string' || text.length === 0 || text.length > MAX_LINK_DATA) return null;
  try{
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder('utf-8', { fatal:true }).decode(bytes));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  }catch{
    return null;
  }
}

/** Everything a document needs to be rebuilt, in a language-neutral form. */
function snapshot(doc){
  const fields = {};
  for(const id of doc.fieldIds){
    const v = $(id).value;
    if(v !== '') fields[id] = v;
  }

  const toggles = {};
  for(const { key } of Object.values(doc.toggles)) toggles[key] = state[key];

  return {
    v: CLEARJD_VERSION,
    doc: doc.id,
    lang,
    fields,
    state: toggles,
    rows: doc.rows ? doc.rows.rows.map(r => ({ ...r })) : [],
  };
}

const shareLink = doc =>
  `${location.href.split('#')[0]}#${doc.id}=${encodeShare(snapshot(doc))}`;

/**
 * Turn whatever came out of a link into values the form accepts, or null.
 * Unknown keys are dropped, option values must be ones the form offers,
 * text is capped, and nothing is ever interpreted as markup.
 */
function sanitizeShare(doc, data){
  if(!data || data.doc !== doc.id) return null;

  const text = (v, cap) => (typeof v === 'string' || typeof v === 'number') ? String(v).slice(0, cap) : '';
  const source = data.fields && typeof data.fields === 'object' ? data.fields : {};

  const fields = {};
  for(const id of doc.fieldIds){
    if(id in doc.selects) continue;
    fields[id] = text(source[id], MAX_FIELD_TEXT);
  }
  for(const [id, { fallback, values }] of Object.entries(doc.selects)){
    fields[id] = values().includes(source[id]) ? source[id] : fallback;
  }

  const given = data.state && typeof data.state === 'object' ? data.state : {};
  const toggles = {};
  for(const group of Object.values(doc.toggles)){
    const allowed = group.values();
    const v = given[group.key];
    if(group.multi){
      const on = new Set(Array.isArray(v) ? v : []);
      toggles[group.key] = allowed.filter(x => on.has(x));
    } else {
      toggles[group.key] = allowed.includes(v) ? v : doc.defaults[group.key];
    }
  }

  const rows = [];
  if(doc.rows && Array.isArray(data.rows)){
    const blank = doc.rows.blank();
    for(const r of data.rows.slice(0, doc.rows.max)){
      if(!r || typeof r !== 'object') continue;
      rows.push(Object.fromEntries(Object.keys(blank).map(k => [k, text(r[k], MAX_ROW_TEXT)])));
    }
  }

  return {
    lang: typeof data.lang === 'string' && Object.hasOwn(I18N, data.lang) ? data.lang : lang,
    fields,
    state: toggles,
    rows,
    version: typeof data.v === 'string' ? data.v : '',
  };
}

const majorOf = v => String(v).split('.')[0];

/**
 * Read the fragment and act on it:
 *   #card          open the empty candidate card (the link a recruiter sends)
 *   #card=<data>   open a shared card
 *   #jd=<data>     open a shared job description
 * Returns the notice to show, if any.
 */
function readHash(hash){
  const m = /^#(jd|card)(?:=(.*))?$/.exec(hash || '');
  if(!m) return null;
  const doc = DOCS[m[1]];

  if(m[2] === undefined){
    setMode(doc.id);
    return null;
  }

  const clean = sanitizeShare(doc, decodeShare(m[2]));
  if(!clean){
    setMode(doc.id);
    return dict().share_invalid;
  }

  loadInto(doc, clean);
  const d = dict();
  return clean.version && majorOf(clean.version) !== majorOf(CLEARJD_VERSION)
    ? `${d.share_opened} ${d.share_version.replace('{v}', clean.version)}`
    : d.share_opened;
}
