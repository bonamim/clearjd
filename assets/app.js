/* ClearJD generator.
 *
 * Everything runs in the browser. Nothing is stored, nothing is sent anywhere.
 *
 * The flow is deliberately one-directional:
 *   form inputs -> collect() -> { render() to the preview, toMarkdown() to export }
 *
 * collect() is the single source of truth. The preview and the exported file
 * both read from it, so what you see is always what you copy.
 */
'use strict';

/* Toggle groups: the DOM id of the row, and the state key it drives. */
const TOGGLE_GROUPS = {
  f_test:      'test',
  f_test_unit: 'testUnit',
  f_mode:      'mode',
  f_days_unit: 'daysUnit',
  f_bond:      'bond',
  f_period:    'period',
};

/* Every text input in the form. Listed explicitly so loading an example can
   clear the fields it does not set, instead of leaving stale values behind. */
const FIELD_IDS = [
  'f_title', 'f_stages_count', 'f_test_time',
  'f_feedback_days', 'f_decision_days',
  'f_days', 'f_tz', 'f_contract', 'f_contract_other', 'f_client',
  'f_min', 'f_max', 'f_currency', 'f_currency_other', 'f_benefits',
  'f_required', 'f_nice', 'f_expect',
];

const MAX_STAGES = 12;

/* One entry per interview stage: { what, minutes }.
   Held here rather than read back out of the DOM, because the rows are built
   dynamically and the count changes as the user types. */
let stages = [];

const DEFAULT_STATE = Object.freeze({
  test:'none', testUnit:'hours',
  mode:'remote', daysUnit:'week',
  bond:'direct',
  period:'year',
});

let lang = 'en';
const state = { ...DEFAULT_STATE };

const $ = id => document.getElementById(id);
const dict = () => I18N[lang];
const val = id => $(id).value.trim();

const escapeHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* "1 day" vs "2 days". */
const plural = (n, one, many) => (Number(n) === 1 ? one : many);


/* ---------------------------------------------------------------- i18n -- */

/* Rebuild a <select>, keeping whatever was already chosen. Options are
   translated, values are not, so the selection survives a language change. */
function fillSelect(id, options){
  const el = $(id);
  const chosen = el.value;
  el.innerHTML = options
    .map(o=>`<option value="${escapeHtml(o.v)}">${escapeHtml(o.label)}</option>`)
    .join('');
  // Select explicitly rather than relying on the browser picking the first
  // option, so the value is the same however this code is driven.
  el.value = options.some(o => o.v === chosen) ? chosen : options[0].v;
}

const contractTypes = () => dict().contract_types;

/* Options carry their own short explanation, so the list can be read without
   selecting each entry to find out what it means. */
const contractOptions = () => contractTypes().map(t => ({
  v: t.v,
  label: t.short ? `${t.label} (${t.short})` : t.label,
}));

const currencyOptions = () => [
  ...CURRENCIES.map(c => ({ v:c, label:c })),
  { v:'other', label:dict().opt_currency_other },
];

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

  // Contract wording differs per market, so the option labels are translated.
  fillSelect('f_contract', contractOptions());
  fillSelect('f_currency', currencyOptions());
  renderStageInputs();
}

/* Contract types are jargon to a lot of readers, so the chosen one explains
   itself in plain language right under the field. */
function syncContractHelp(){
  const chosen = contractTypes().find(t => t.v === $('f_contract').value);
  $('contractHelp').textContent = chosen ? chosen.help : '';
}


/* ------------------------------------------------------ interview stages -- */

/**
 * Resize the stage list to `count`, keeping whatever has already been typed.
 * Shrinking discards the trailing stages, growing appends empty ones.
 */
function setStageCount(count){
  const n = Math.max(0, Math.min(MAX_STAGES, Number(count) || 0));
  while(stages.length < n) stages.push({ what:'', minutes:'' });
  stages.length = n;
}

/** Build one input row per stage. */
function renderStageInputs(){
  const d = dict();
  const label = (key, n) => escapeHtml(d[key].replace('{n}', n));

  $('stageList').innerHTML = stages.map((stage, i) => `
    <div class="stage-row">
      <span class="stage-badge" aria-hidden="true">${i + 1}</span>
      <input type="text" class="stage-what"
             data-stage="${i}" data-stage-field="what"
             value="${escapeHtml(stage.what)}"
             aria-label="${label('a11y_stage_what', i + 1)}"
             placeholder="${escapeHtml(d.ph_stage_what)}">
      <input type="number" class="stage-minutes" min="0" max="600" step="5"
             data-stage="${i}" data-stage-field="minutes"
             value="${escapeHtml(stage.minutes)}"
             aria-label="${label('a11y_stage_minutes', i + 1)}"
             placeholder="${escapeHtml(d.ph_stage_minutes)}">
      <span class="unit-suffix">${escapeHtml(d.unit_minutes)}</span>
    </div>`).join('');

  $('f_stage_list_wrap').hidden = stages.length === 0;
}

/** "1. HR screening (30min), 2. Technical (60min)" */
function stageBreakdown(){
  const d = dict();
  return stages
    .map((s, i) => {
      if(!s.what) return null;
      const minutes = s.minutes ? ` (${s.minutes}${d.unit_minutes})` : '';
      return `${i + 1}. ${s.what}${minutes}`;
    })
    .filter(Boolean)
    .join(', ');
}

/** "You hear back within 5 working days of each stage. Final decision..." */
function feedbackText(){
  const d = dict();
  const workdays = n => plural(n, d.workday_one, d.workday_many);
  const each = val('f_feedback_days');
  const final = val('f_decision_days');

  return [
    each  && d.feedback_each.replace('{n}', each).replace('{u}', workdays(each)),
    final && d.feedback_final.replace('{n}', final).replace('{u}', workdays(final)),
  ].filter(Boolean).join(' ');
}


/* ------------------------------------------------------------ form state -- */

function wireToggleGroup(rowId, stateKey){
  const row = $(rowId);
  row.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-val]');
    if(!btn) return;
    state[stateKey] = btn.dataset.val;
    row.querySelectorAll('button').forEach(b=>{
      b.setAttribute('aria-pressed', String(b === btn));
    });
    syncConditionalFields();
    render();
  });
}

/* Fields that only make sense given another answer. */
function syncConditionalFields(){
  $('f_days_wrap').hidden           = state.mode !== 'hybrid';
  $('f_client_wrap').hidden         = state.bond !== 'agency';
  $('f_test_time_wrap').hidden      = state.test === 'none';
  $('f_contract_other_wrap').hidden = $('f_contract').value !== 'other';
  $('f_currency_other_wrap').hidden = $('f_currency').value !== 'other';
  syncContractHelp();
}

/* Reflect `state` back onto the toggle buttons, after loading an example. */
function syncToggleUI(){
  for(const [rowId, key] of Object.entries(TOGGLE_GROUPS)){
    $(rowId).querySelectorAll('button').forEach(b=>{
      b.setAttribute('aria-pressed', String(b.dataset.val === state[key]));
    });
  }
  document.querySelectorAll('#langToggle button').forEach(b=>{
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
}

/* Load one of the worked examples into the form. */
function loadExample(id){
  const example = EXAMPLES.find(e => e.id === id);
  if(!example) return;

  // Assign every field, so values the example omits are cleared rather than
  // left over from whatever was there before.
  FIELD_IDS.forEach(f => { $(f).value = example.fields[f] || ''; });

  stages = (example.stages || []).map(s => ({ ...s }));
  $('f_stages_count').value = String(stages.length);

  Object.assign(state, DEFAULT_STATE, example.state);
  lang = example.lang;

  applyStaticI18n();
  $('f_contract').value = example.fields.f_contract || 'permanent';
  $('f_currency').value = example.fields.f_currency || 'EUR';
  syncToggleUI();
  syncConditionalFields();
  render();
}


/* ------------------------------------------------------- document model -- */

/**
 * Resolve every control into the final strings the job description uses.
 * Returns plain text: escaping happens at render time, Markdown needs none.
 */
function collect(){
  const d = dict();

  // Interview stages: the count is what candidates scan for, the per-stage
  // breakdown is what tells them whether it is worth their evenings.
  const count  = val('f_stages_count');
  const detail = stageBreakdown();
  let stageText = count ? `${count} ${plural(count, d.stage_one, d.stage_many)}` : '';
  if(detail) stageText = stageText ? `${stageText}. ${detail}` : detail;

  // Technical assessment: format first, then how long it takes.
  const testLabel = {
    none: d.opt_test_none, live: d.opt_test_live,
    home: d.opt_test_home, both: d.opt_test_both,
  }[state.test];
  const testTime = val('f_test_time');
  const testUnit = state.testUnit === 'days'
    ? plural(testTime, d.day_one, d.day_many)
    : plural(testTime, d.hour_one, d.hour_many);
  const test = (state.test !== 'none' && testTime)
    ? `${testLabel} (${testTime} ${testUnit})`
    : testLabel;

  // Work mode: on-site days always carry their unit.
  let mode = { remote:d.opt_remote, hybrid:d.opt_hybrid, onsite:d.opt_onsite }[state.mode];
  const days = val('f_days');
  if(state.mode === 'hybrid' && days){
    const unit = state.daysUnit === 'month' ? d.opt_per_month : d.opt_per_week;
    mode += `. ${d.min_onsite} ${days} ${plural(days, d.day_one, d.day_many)} ${unit}`;
  }

  // Contract type and currency come from selects, with a free-text escape
  // hatch for markets the closed list does not cover.
  const contractType = $('f_contract').value;
  const contract = contractType === 'other'
    ? val('f_contract_other')
    : (contractTypes().find(t => t.v === contractType)?.label || '');

  const currencyCode = $('f_currency').value;
  const currency = currencyCode === 'other' ? val('f_currency_other') : currencyCode;

  const client = val('f_client');
  const min = val('f_min'), max = val('f_max');
  const period = { year:d.opt_year, month:d.opt_month, hour:d.opt_hour }[state.period];

  return {
    title:    val('f_title') || d.doc_title_ph,
    stages:   stageText,
    feedback: feedbackText(),
    test,
    mode,
    tz:       val('f_tz'),
    contract,
    bond:     state.bond === 'direct' ? d.bond_direct : `${d.bond_agency} ${client || d.empty}`,
    salary:   (min || max)
                ? `${min || '?'} ${d.range_to} ${max || '?'} ${currency} ${period}`.replace(/\s+/g,' ').trim()
                : '',
    salaryInverted: min !== '' && max !== '' && Number(min) > Number(max),
    benefits: val('f_benefits'),
    required: val('f_required'),
    nice:     val('f_nice'),
    expect:   val('f_expect').split('\n').map(s=>s.trim()).filter(Boolean),
  };
}


/* --------------------------------------------------------- live preview -- */

const mark = text => text
  ? `<span class="v">${escapeHtml(text)}</span>`
  : `<span class="empty">${dict().empty}</span>`;

function markList(text){
  if(!text) return `<span class="empty">${dict().empty}</span>`;
  return text.split(/[,\n]/).map(s=>s.trim()).filter(Boolean)
    .map(s=>`<span class="v">${escapeHtml(s)}</span>`).join(', ');
}

function render(){
  const d = dict();
  const f = collect();

  $('salaryWarn').hidden = !f.salaryInverted;
  $('f_min').setAttribute('aria-invalid', String(f.salaryInverted));
  $('f_max').setAttribute('aria-invalid', String(f.salaryInverted));

  const row = (label, value) => `<p><span class="k">${label}</span> ${mark(value)}</p>`;

  $('doc').innerHTML = [
    `<h2>${escapeHtml(f.title)}</h2>`,

    `<h3>${d.doc_essentials}</h3>`,
    row(d.doc_stages,   f.stages),
    row(d.doc_test,     f.test),
    row(d.doc_feedback, f.feedback),
    row(d.doc_mode,     f.mode),
    row(d.doc_tz,       f.tz),
    row(d.doc_contract, f.contract),
    row(d.doc_bond,     f.bond),
    row(d.doc_salary,   f.salary),
    row(d.doc_benefits, f.benefits),

    `<h3>${d.doc_stack}</h3>`,
    `<p><span class="k">${d.doc_req}</span> ${markList(f.required)}</p>`,
    `<p><span class="k">${d.doc_nice}</span> ${markList(f.nice)}</p>`,

    `<h3>${d.doc_expect}</h3>`,
    f.expect.length
      ? f.expect.map(i=>`<p><span class="bullet">•</span> <span class="v">${escapeHtml(i)}</span></p>`).join('')
      : `<p class="empty">${d.empty}</p>`,
  ].join('');
}


/* ------------------------------------------------------ Markdown export -- */

function toMarkdown(){
  const d = dict();
  const f = collect();
  const or = v => v || d.empty;

  return `# ${f.title}

## ${d.doc_essentials}

**${d.doc_stages}** ${or(f.stages)}

**${d.doc_test}** ${f.test}

**${d.doc_feedback}** ${or(f.feedback)}

**${d.doc_mode}** ${f.mode}

**${d.doc_tz}** ${or(f.tz)}

**${d.doc_contract}** ${or(f.contract)}

**${d.doc_bond}** ${f.bond}

**${d.doc_salary}** ${or(f.salary)}

**${d.doc_benefits}** ${or(f.benefits)}

---

## ${d.doc_stack}

- ${d.doc_req} ${or(f.required)}
- ${d.doc_nice} ${or(f.nice)}

---

## ${d.doc_expect}

${f.expect.length ? f.expect.map(s=>`- ${s}`).join('\n') : `- ${d.empty}`}

---

*${d.doc_footer.replace('{v}', CLEARJD_VERSION)}*
`;
}

function filename(){
  const slug = (val('f_title') || dict().fallback_filename)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // keep accented titles readable
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
  return `${slug || dict().fallback_filename}.md`;
}


/* ---------------------------------------------------------------- wiring -- */

$('langToggle').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-lang]');
  if(!btn) return;
  lang = btn.dataset.lang;
  document.querySelectorAll('#langToggle button').forEach(b=>{
    b.setAttribute('aria-pressed', String(b === btn));
  });
  applyStaticI18n();
  render();
});

Object.entries(TOGGLE_GROUPS).forEach(([rowId, key]) => wireToggleGroup(rowId, key));

document.querySelectorAll('input, textarea').forEach(el=>{
  el.addEventListener('input', render);
});

// Changing the count rebuilds the rows; typing in a row updates the model.
$('f_stages_count').addEventListener('input', ()=>{
  setStageCount($('f_stages_count').value);
  renderStageInputs();
  render();
});

$('stageList').addEventListener('input', e=>{
  const el = e.target.closest('[data-stage]');
  if(!el) return;
  stages[Number(el.dataset.stage)][el.dataset.stageField] = el.value;
  render();
});

document.querySelectorAll('select').forEach(el=>{
  el.addEventListener('change', ()=>{ syncConditionalFields(); render(); });
});

$('exampleRow').addEventListener('click', e=>{
  const btn = e.target.closest('button[data-example]');
  if(btn) loadExample(btn.dataset.example);
});

let copyResetTimer = null;
$('btnCopy').addEventListener('click', async ()=>{
  const btn = $('btnCopy');
  const d = dict();
  try{
    await navigator.clipboard.writeText(toMarkdown());
    btn.textContent = d.btn_copied;
    btn.classList.add('copied');
    $('copyStatus').textContent = d.btn_copied;
    // Always restore the label from the dictionary, never from the button's
    // current text, or a second click inside the window sticks on "Copied".
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(()=>{
      btn.textContent = dict().btn_copy;
      btn.classList.remove('copied');
      $('copyStatus').textContent = '';
    }, 1800);
  }catch{
    // The clipboard API needs a secure context, which file:// does not provide.
    $('copyStatus').textContent = d.copy_failed;
    window.alert(d.copy_failed);
  }
});

$('btnDownload').addEventListener('click', ()=>{
  const blob = new Blob([toMarkdown()], {type:'text/markdown;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
