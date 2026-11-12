/* The job description: what a recruiter fills in.
 *
 * collect() is the single source of truth. The preview and the exported file
 * both read from it, so what you see is always what you copy.
 */
'use strict';

/* Every static text control in the form. Listed explicitly so loading an
   example can clear the fields it does not set, instead of leaving stale
   values behind. */
const FIELD_IDS = [
  'f_title', 'f_stages_count', 'f_test_time',
  'f_feedback_days', 'f_decision_days',
  'f_days', 'f_tz', 'f_contract', 'f_contract_other', 'f_client',
  'f_min', 'f_max', 'f_currency', 'f_currency_other', 'f_benefits',
  'f_required', 'f_nice', 'f_expect',
];

const MAX_STAGES = 12;

/* One entry per interview stage: { what, minutes }. */
const stageList = makeRowList({
  containerId:'stageList',
  max:MAX_STAGES,
  columns:[
    { field:'what', cls:'stage-what', a11y:'a11y_stage_what', ph:'ph_stage_what' },
    { field:'minutes', cls:'stage-minutes', type:'number', attrs:'min="0" max="600" step="5"',
      a11y:'a11y_stage_minutes', ph:'ph_stage_minutes', suffix:'unit_minutes' },
  ],
});

/* Contract types are jargon to a lot of readers, so the options carry their
   own short explanation and the chosen one explains itself under the field. */
const contractOptions = () => contractTypes().map(t => ({
  v: t.v,
  label: t.short ? `${t.label} (${t.short})` : t.label,
}));

function syncContractHelp(){
  const chosen = contractTypes().find(t => t.v === $('f_contract').value);
  $('contractHelp').textContent = chosen ? chosen.help : '';
}

/** "1. HR screening (30min), 2. Technical (60min)" */
function stageBreakdown(){
  const d = dict();
  return stageList.rows
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
  let workMode = { remote:d.opt_remote, hybrid:d.opt_hybrid, onsite:d.opt_onsite }[state.mode];
  const days = val('f_days');
  if(state.mode === 'hybrid' && days){
    const unit = state.daysUnit === 'month' ? d.opt_per_month : d.opt_per_week;
    workMode += `. ${d.min_onsite} ${days} ${plural(days, d.day_one, d.day_many)} ${unit}`;
  }

  // Contract type comes from a select, with a free-text escape hatch for
  // markets the closed list does not cover.
  const contractType = $('f_contract').value;
  const contract = contractType === 'other'
    ? val('f_contract_other')
    : (contractTypes().find(t => t.v === contractType)?.label || '');

  const client = val('f_client');
  const min = val('f_min'), max = val('f_max');

  return {
    title:    val('f_title') || d.doc_title_ph,
    stages:   stageText,
    feedback: feedbackText(),
    test,
    mode:     workMode,
    tz:       val('f_tz'),
    contract,
    bond:     state.bond === 'direct' ? d.bond_direct : `${d.bond_agency} ${client || d.empty}`,
    salary:   formatSalary(min, max, currencyValue('f_currency', 'f_currency_other'), state.period),
    salaryInverted: salaryInverted(min, max),
    benefits: val('f_benefits'),
    required: val('f_required'),
    nice:     val('f_nice'),
    expect:   val('f_expect').split('\n').map(s=>s.trim()).filter(Boolean),
  };
}

function renderJd(){
  const d = dict();
  const f = collect();

  $('salaryWarn').hidden = !f.salaryInverted;
  $('f_min').setAttribute('aria-invalid', String(f.salaryInverted));
  $('f_max').setAttribute('aria-invalid', String(f.salaryInverted));

  $('doc').innerHTML = [
    `<h2>${escapeHtml(f.title)}</h2>`,

    `<h3>${d.doc_essentials}</h3>`,
    previewRow(d.doc_stages,   f.stages),
    previewRow(d.doc_test,     f.test),
    previewRow(d.doc_feedback, f.feedback),
    previewRow(d.doc_mode,     f.mode),
    previewRow(d.doc_tz,       f.tz),
    previewRow(d.doc_contract, f.contract),
    previewRow(d.doc_bond,     f.bond),
    previewRow(d.doc_salary,   f.salary),
    previewRow(d.doc_benefits, f.benefits),

    `<h3>${d.doc_stack}</h3>`,
    `<p><span class="k">${d.doc_req}</span> ${markList(f.required)}</p>`,
    `<p><span class="k">${d.doc_nice}</span> ${markList(f.nice)}</p>`,

    `<h3>${d.doc_expect}</h3>`,
    previewBullets(f.expect),
  ].join('');
}

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

const filename = () => slugify(val('f_title'), dict().fallback_filename);

DOCS.jd = {
  id:'jd',
  prefix:'f_',
  fieldIds:FIELD_IDS,
  toggles:{
    f_test:      { key:'test',     values:fixed('none','live','home','both') },
    f_test_unit: { key:'testUnit', values:fixed('hours','days') },
    f_mode:      { key:'mode',     values:fixed('remote','hybrid','onsite') },
    f_days_unit: { key:'daysUnit', values:fixed('week','month') },
    f_bond:      { key:'bond',     values:fixed('direct','agency') },
    f_period:    { key:'period',   values:fixed('year','month','hour') },
  },
  defaults:Object.freeze({
    test:'none', testUnit:'hours',
    mode:'remote', daysUnit:'week',
    bond:'direct',
    period:'year',
  }),
  selects:{
    f_contract:{ fallback:'permanent', values:() => contractTypes().map(t => t.v) },
    f_currency:{ fallback:'EUR',       values:currencyValues },
  },
  rows:stageList,
  rowsKey:'stages',           // where an example keeps its rows
  rowCountField:'f_stages_count',

  fillSelects(){
    fillSelect('f_contract', contractOptions());
    fillSelect('f_currency', currencyOptions());
  },

  syncConditional(){
    $('f_days_wrap').hidden           = state.mode !== 'hybrid';
    $('f_client_wrap').hidden         = state.bond !== 'agency';
    $('f_test_time_wrap').hidden      = state.test === 'none';
    $('f_contract_other_wrap').hidden = $('f_contract').value !== 'other';
    $('f_currency_other_wrap').hidden = $('f_currency').value !== 'other';
    $('f_stage_list_wrap').hidden     = stageList.rows.length === 0;
    syncContractHelp();
  },

  collect, render:renderJd, toMarkdown, filename,
};

resetState(DOCS.jd);
