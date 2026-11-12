/* ClearJD page wiring.
 *
 * Everything runs in the browser. Nothing is stored, nothing is sent anywhere.
 * The documents themselves live in jd.js and card.js; this file connects
 * their controls to the page and switches between them.
 */
'use strict';

const activeDoc = () => DOCS[mode];

/* Draw the active document. Both the preview and the export read collect(). */
const render = () => activeDoc().render();

function applyStaticI18n(){
  const d = dict();
  document.documentElement.lang = lang;
  document.title = d.pageTitle;

  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    if(key === 'h1'){
      // The only translated string carrying markup: the highlighted phrase.
      el.innerHTML = `<span class="hl">${escapeHtml(d.h1_pre)}</span> ${escapeHtml(d.h1_post)}`;
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

/* Reflect state back onto every toggle button, after loading an example. */
function syncToggleUI(){
  Object.values(DOCS).forEach(doc => {
    for(const [rowId, group] of Object.entries(doc.toggles)) syncToggleRow(rowId, group);
  });
  document.querySelectorAll('#langToggle button').forEach(b=>{
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
}

const syncConditionalFields = () => Object.values(DOCS).forEach(doc => doc.syncConditional());

/* Kept under their old names: the stage list predates the row-list helper. */
const setStageCount = n => stageList.resize(n);
const renderStageInputs = () => stageList.render();

/* Load one of the worked examples into the form of the document it is for. */
function loadExample(id){
  const example = EXAMPLES.find(e => e.id === id);
  if(!example) return;
  const doc = DOCS[example.doc || 'jd'];

  // Assign every field, so values the example omits are cleared rather than
  // left over from whatever was there before.
  doc.fieldIds.forEach(f => { $(f).value = example.fields[f] || ''; });

  if(doc.rows){
    doc.rows.set(example[doc.rowsKey] || []);
    if(doc.rowCountField) $(doc.rowCountField).value = String(doc.rows.rows.length);
  }

  resetState(doc);
  Object.assign(state, structuredClone(example.state || {}));
  lang = example.lang;
  mode = doc.id;

  applyStaticI18n();
  for(const [id, fallback] of Object.entries(doc.selects)){
    $(id).value = example.fields[id] || fallback;
  }
  syncToggleUI();
  syncConditionalFields();
  render();
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

$('btnDownload').addEventListener('click', ()=>{
  downloadText(activeDoc().toMarkdown(), activeDoc().filename());
});

/* Example chips are built from the data, so adding an example to
   assets/examples.js is enough to make it appear on the page. */
$('exampleRow').innerHTML = EXAMPLES.map(e=>`
  <button type="button" class="example-chip" data-example="${escapeHtml(e.id)}">
    <span class="example-label">
      ${escapeHtml(e.label)}
      <span class="example-lang">${escapeHtml(e.lang)}</span>
    </span>
    <span class="example-note">${escapeHtml(e.note)}</span>
  </button>`).join('');

$('versionTag').textContent = `v${CLEARJD_VERSION}`;
applyStaticI18n();
syncConditionalFields();
render();
