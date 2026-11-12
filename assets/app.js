/* ClearJD page wiring.
 *
 * Everything runs in the browser. Nothing is stored, and nothing is sent
 * anywhere unless you send a share link yourself. The documents live in
 * jd.js and card.js; this file connects their controls to the page and
 * switches between them.
 */
'use strict';

const activeDoc = () => DOCS[mode];

/* Draw the active document. Both the preview and the export read collect(). */
const render = () => activeDoc().render();

/* Text that differs between the two modes carries a second key,
   data-i18n-card, used while the candidate card is open. */
function applyStaticI18n(){
  const d = dict();
  document.documentElement.lang = lang;
  document.title = mode === 'card' ? d.card_pageTitle : d.pageTitle;

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = (mode === 'card' && el.dataset.i18nCard) || el.dataset.i18n;
    if(key === 'h1' || key === 'card_h1'){
      // The only translated string carrying markup: the highlighted phrase.
      el.innerHTML = `<span class="hl">${escapeHtml(d[`${key}_pre`])}</span> ${escapeHtml(d[`${key}_post`])}`;
    } else if(d[key] !== undefined){
      el.textContent = d[key];
    }
  });

  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key = el.dataset.i18nPh;
    if(d[key] !== undefined) el.placeholder = d[key];
  });

  // Option labels are translated, so every select and row list is rebuilt.
  Object.values(DOCS).forEach(doc => {
    doc.fillSelects();
    doc.rows?.render();
  });
}

/* Reflect state back onto every toggle button. */
function syncToggleUI(){
  Object.values(DOCS).forEach(doc => {
    for(const [rowId, group] of Object.entries(doc.toggles)) syncToggleRow(rowId, group);
  });
  document.querySelectorAll('#langToggle button').forEach(b=>{
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
  document.querySelectorAll('#modeToggle button').forEach(b=>{
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  });
}

const syncConditionalFields = () => Object.values(DOCS).forEach(doc => doc.syncConditional());

/* Kept under their old names: the stage list predates the row-list helper. */
const setStageCount = n => stageList.resize(n);
const renderStageInputs = () => stageList.render();

/* Only the examples for the open document are offered. */
function renderExampleChips(){
  $('exampleRow').innerHTML = EXAMPLES.filter(e => (e.doc || 'jd') === mode).map(e=>`
  <button type="button" class="example-chip" data-example="${escapeHtml(e.id)}">
    <span class="example-label">
      ${escapeHtml(e.label)}
      <span class="example-lang">${escapeHtml(e.lang)}</span>
    </span>
    <span class="example-note">${escapeHtml(e.note)}</span>
  </button>`).join('');
}

function showNotice(text){
  $('shareNotice').textContent = text || '';
  $('shareNotice').hidden = !text;
}

/* Switch between the job description and the candidate card. Each keeps
   what was typed into it, so switching back and forth loses nothing. */
function setMode(id){
  mode = id;
  for(const doc of Object.values(DOCS)) $(`form_${doc.id}`).hidden = doc.id !== mode;
  showNotice('');
  renderExampleChips();
  applyStaticI18n();
  syncToggleUI();
  syncConditionalFields();
  render();
}

/**
 * Put a complete set of values into a document's form: every field, every
 * toggle, every row. Used for worked examples and for shared links, so both
 * clear whatever was there before rather than mixing with it.
 */
function loadInto(doc, { fields = {}, rows = [], state: given = {}, lang: language }){
  doc.fieldIds.forEach(f => { $(f).value = fields[f] || ''; });

  if(doc.rows){
    doc.rows.set(rows);
    if(doc.rowCountField) $(doc.rowCountField).value = String(doc.rows.rows.length);
  }

  resetState(doc);
  Object.assign(state, structuredClone(given));
  if(language) lang = language;

  setMode(doc.id);
  for(const [id, { fallback }] of Object.entries(doc.selects)){
    $(id).value = fields[id] || fallback;
  }
  syncConditionalFields();
  render();
}

function loadExample(id){
  const example = EXAMPLES.find(e => e.id === id);
  if(!example) return;
  const doc = DOCS[example.doc || 'jd'];
  loadInto(doc, {
    fields: example.fields,
    rows: example[doc.rowsKey] || [],
    state: example.state,
    lang: example.lang,
  });
}

/* Open whatever the address points at, and keep the bare #card link in the
   address bar while the card is open, so it can be copied and sent. */
function openFromAddress(){
  const notice = readHash(location.hash);
  if(notice) showNotice(notice);
}

function switchMode(id){
  if(id === mode) return;
  setMode(id);
  history.replaceState(null, '', id === 'card' ? '#card' : location.href.split('#')[0]);
}


/* -------------------------------------------------------- copy and save -- */

/* Swap a button's label for a moment, then restore it from the dictionary,
   never from the button's current text, or a second click inside the window
   sticks on "Copied". */
const resetTimers = {};
function flashButton(btn, key, restoreKey){
  btn.textContent = dict()[key];
  btn.classList.add('copied');
  $('copyStatus').textContent = dict()[key];
  clearTimeout(resetTimers[btn.id]);
  resetTimers[btn.id] = setTimeout(()=>{
    btn.textContent = dict()[restoreKey];
    btn.classList.remove('copied');
    $('copyStatus').textContent = '';
  }, 1800);
}

function downloadText(text, name){
  const blob = new Blob([text], {type:'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


/* ---------------------------------------------------------------- wiring -- */

$('langToggle').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-lang]');
  if(!btn) return;
  lang = btn.dataset.lang;
  syncToggleUI();
  applyStaticI18n();
  syncConditionalFields();
  render();
});

$('modeToggle').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-mode]');
  if(btn) switchMode(btn.dataset.mode);
});

Object.values(DOCS).forEach(doc => {
  for(const [rowId, group] of Object.entries(doc.toggles)){
    wireToggleGroup(rowId, group, ()=>{ syncConditionalFields(); render(); });
  }
  doc.rows?.wire(()=>{ syncConditionalFields(); render(); });
});

document.querySelectorAll('input, textarea').forEach(el=>{
  el.addEventListener('input', render);
});

// Changing the count rebuilds the rows; typing in a row updates the model.
$('f_stages_count').addEventListener('input', ()=>{
  setStageCount($('f_stages_count').value);
  renderStageInputs();
  syncConditionalFields();
  render();
});

// A new technology row takes focus, so a keyboard user can type straight away.
$('btnAddTech').addEventListener('click', ()=>{
  techList.resize(techList.rows.length + 1);
  techList.render();
  render();
  document.querySelector(`#techList [data-row="${techList.rows.length - 1}"]`)?.focus();
});

document.querySelectorAll('select').forEach(el=>{
  el.addEventListener('change', ()=>{ syncConditionalFields(); render(); });
});

$('exampleRow').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-example]');
  if(btn) loadExample(btn.dataset.example);
});

$('btnCopy').addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(activeDoc().toMarkdown());
    flashButton($('btnCopy'), 'btn_copied', 'btn_copy');
  }catch{
    // The clipboard API needs a secure context, which file:// does not provide.
    $('copyStatus').textContent = dict().copy_failed;
    window.alert(dict().copy_failed);
  }
});

$('btnShare').addEventListener('click', async ()=>{
  const link = shareLink(activeDoc());
  try{
    await navigator.clipboard.writeText(link);
    flashButton($('btnShare'), 'btn_share_copied', 'btn_share');
  }catch{
    // Without a clipboard, hand the link over in a box it can be copied from.
    window.prompt(dict().share_failed, link);
  }
});

$('btnDownload').addEventListener('click', ()=>{
  downloadText(activeDoc().toMarkdown(), activeDoc().filename());
});

// A link pasted into a tab that is already open.
window.addEventListener('hashchange', openFromAddress);

$('versionTag').textContent = `v${CLEARJD_VERSION}`;
setMode('jd');
openFromAddress();
