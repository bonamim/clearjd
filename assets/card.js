/* The candidate card: the screening answers a candidate gives every time.
 *
 * Filled in once, then sent to any recruiter who asks, as a link or as
 * Markdown. The fields mirror the job description's, with the same option
 * values (work modes, contract types, currencies, periods), so the two can be
 * compared field by field later.
 */
'use strict';

const CARD_FIELD_IDS = [
  'c_name', 'c_location',
  'c_days', 'c_contract_note',
  'c_notice',
  'c_min', 'c_max', 'c_currency', 'c_currency_other',
  'c_relocate_cond',
];

/* Years per technology is a structured list on purpose: one technology and a
   number per row, so the result can be read at a glance and compared with a
   job's stack, rather than a paragraph nobody can scan. */
const MAX_TECHS = 20;
const MAX_TECH_YEARS = 50;
const TECH_NAME_MAX = 40;

const techList = makeRowList({
  containerId:'techList',
  max:MAX_TECHS,
  removable:true,
  removeKey:'a11y_tech_remove',
  columns:[
    { field:'name', cls:'tech-name', a11y:'a11y_tech_name', ph:'ph_tech_name',
      attrs:`maxlength="${TECH_NAME_MAX}" list="techSuggestions" autocomplete="off"` },
    { field:'years', cls:'tech-years', type:'number', attrs:`min="0" max="${MAX_TECH_YEARS}" step="0.5"`,
      a11y:'a11y_tech_years', ph:'ph_tech_years', suffix:'unit_years' },
  ],
});

/* Contract types a candidate can accept: the job description's list, minus
   "other", which the free note covers. */
const cardContractValues = () => contractTypes().map(t => t.v).filter(v => v !== 'other');

/* A number of years as typed, made safe: 0 to 50, in steps of half a year. */
function cleanYears(raw){
  const n = Number(String(raw).replace(',', '.'));
  if(String(raw).trim() === '' || !Number.isFinite(n)) return '';
  return String(Math.round(Math.min(MAX_TECH_YEARS, Math.max(0, n)) * 2) / 2);
}

/**
 * The technology list, cleaned: blank rows dropped, names trimmed and
 * capped, duplicates kept once (first row wins), sorted by years with the
 * most experience first. Problems are reported rather than fixed silently.
 */
function techEntries(){
  const seen = new Set();
  const entries = [], lists = [], dups = [];

  techList.rows.forEach((row, index) => {
    const name = String(row.name).trim().slice(0, TECH_NAME_MAX);
    if(!name) return;
    if(/[,;\n]/.test(name)) lists.push(name);   // "CI/CD" and "PL/SQL" are one name

    const key = name.toLowerCase();
    if(seen.has(key)){ dups.push(name); return; }
    seen.add(key);

    entries.push({ name, years:cleanYears(row.years), index });
  });

  // Rows without years sort last; ties keep the order they were typed in.
  entries.sort((a, b) =>
    (b.years === '' ? -1 : Number(b.years)) - (a.years === '' ? -1 : Number(a.years))
    || a.index - b.index);

  return { entries, lists, dups };
}

function collectCard(){
  const d = dict();
  const label = (map, key) => map[key] || '';

  // Work modes: every one the candidate would take, in a fixed order. The
  // on-site ceiling only means something when hybrid is on the list.
  const modeNames = { remote:d.opt_remote, hybrid:d.opt_hybrid, onsite:d.opt_onsite };
  let modes = state.cardModes.map(m => modeNames[m]).join(', ');
  const days = val('c_days');
  if(state.cardModes.includes('hybrid') && days){
    const unit = state.cardDaysUnit === 'month' ? d.opt_per_month : d.opt_per_week;
    modes += `. ${d.max_onsite} ${days} ${plural(days, d.day_one, d.day_many)} ${unit}`;
  }

  // Contract types, then the candidate's own words about them.
  const contractNames = Object.fromEntries(contractTypes().map(t => [t.v, t.label]));
  const note = val('c_contract_note');
  const contracts = [state.cardContracts.map(v => contractNames[v]).join(', '), note]
    .filter(Boolean).join('. ');

  // Notice period: zero means they can start now, which reads better in words.
  const notice = val('c_notice');
  let noticeText = '';
  if(notice !== ''){
    noticeText = Number(notice) === 0
      ? d.notice_now
      : `${notice} ${state.cardNoticeUnit === 'month'
          ? plural(notice, d.month_one, d.month_many)
          : plural(notice, d.week_one, d.week_many)}`;
  }

  const min = val('c_min'), max = val('c_max');

  const relocateText = label({
    yes:d.relocate_yes, no:d.relocate_no, depends:d.relocate_depends,
  }, state.cardRelocate);
  const cond = state.cardRelocate && state.cardRelocate !== 'no' ? val('c_relocate_cond') : '';

  const { entries, lists, dups } = techEntries();
  const yearsText = y => y === '' ? d.empty : `${y} ${plural(y, d.year_one, d.year_many)}`;

  return {
    title:     val('c_name') || d.doc_card_title_ph,
    location:  val('c_location'),
    modes,
    contracts,
    agency:    label({ yes:d.agency_yes, no:d.agency_no }, state.cardAgency),
    notice:    noticeText,
    salary:    formatSalary(min, max, currencyValue('c_currency', 'c_currency_other'),
                            state.cardPeriod, { open:true }),
    salaryInverted: salaryInverted(min, max),
    relocate:  [relocateText, cond].filter(Boolean).join('. '),
    techs:     entries.map(t => ({ name:t.name, years:yearsText(t.years) })),
    techLists: lists,
    techDups:  dups,
  };
}

function techWarnings(f){
  const d = dict();
  return [
    ...f.techLists.map(n => d.warn_tech_list.replace('{name}', n)),
    ...f.techDups.map(n => d.warn_tech_dup.replace('{name}', n)),
  ];
}

function renderCard(){
  const d = dict();
  const f = collectCard();

  $('cardSalaryWarn').hidden = !f.salaryInverted;
  $('c_min').setAttribute('aria-invalid', String(f.salaryInverted));
  $('c_max').setAttribute('aria-invalid', String(f.salaryInverted));

  const warnings = techWarnings(f);
  $('techWarn').hidden = warnings.length === 0;
  $('techWarn').textContent = warnings.join(' ');
  $('btnAddTech').disabled = techList.rows.length >= MAX_TECHS;

  $('doc').innerHTML = [
    `<h2>${escapeHtml(f.title)}</h2>`,

    `<h3>${d.doc_card_conditions}</h3>`,
    previewRow(d.doc_card_location,  f.location),
    previewRow(d.doc_card_modes,     f.modes),
    previewRow(d.doc_card_contracts, f.contracts),
    previewRow(d.doc_card_agency,    f.agency),
    previewRow(d.doc_card_notice,    f.notice),
    previewRow(d.doc_card_salary,    f.salary),
    previewRow(d.doc_card_relocate,  f.relocate),

    `<h3>${d.doc_card_tech}</h3>`,
    previewBullets(f.techs.map(t => `${t.name}: ${t.years}`)),
  ].join('');
}

function cardToMarkdown(){
  const d = dict();
  const f = collectCard();
  const or = v => v || d.empty;

  return `# ${f.title}

## ${d.doc_card_conditions}

**${d.doc_card_location}** ${or(f.location)}

**${d.doc_card_modes}** ${or(f.modes)}

**${d.doc_card_contracts}** ${or(f.contracts)}

**${d.doc_card_agency}** ${or(f.agency)}

**${d.doc_card_notice}** ${or(f.notice)}

**${d.doc_card_salary}** ${or(f.salary)}

**${d.doc_card_relocate}** ${or(f.relocate)}

---

## ${d.doc_card_tech}

${f.techs.length ? f.techs.map(t => `- ${t.name}: ${t.years}`).join('\n') : `- ${d.empty}`}

---

*${d.doc_card_footer.replace('{v}', CLEARJD_VERSION)}*
`;
}

const cardFilename = () => slugify(val('c_name'), dict().fallback_card_filename);

/* Contract chips are built from the translation table, so the list stays
   the same as the job description's in every language. */
function renderCardContractChips(){
  const names = Object.fromEntries(contractTypes().map(t => [t.v, t.label]));
  $('c_contracts').innerHTML = cardContractValues().map(v =>
    `<button type="button" data-val="${escapeHtml(v)}" aria-pressed="${state.cardContracts.includes(v)}">${escapeHtml(names[v])}</button>`
  ).join('');
}

DOCS.card = {
  id:'card',
  prefix:'c_',
  fieldIds:CARD_FIELD_IDS,
  toggles:{
    c_modes:      { key:'cardModes',      values:fixed('remote','hybrid','onsite'), multi:true },
    c_days_unit:  { key:'cardDaysUnit',   values:fixed('week','month') },
    c_contracts:  { key:'cardContracts',  values:cardContractValues, multi:true },
    c_agency:     { key:'cardAgency',     values:fixed('yes','no') },
    c_notice_unit:{ key:'cardNoticeUnit', values:fixed('week','month') },
    c_period:     { key:'cardPeriod',     values:fixed('year','month','hour') },
    c_relocate:   { key:'cardRelocate',   values:fixed('yes','no','depends') },
  },
  // Questions with no safe default start unanswered, so an untouched card
  // says "not filled in yet" instead of quietly answering for the candidate.
  defaults:Object.freeze({
    cardModes:[], cardDaysUnit:'week',
    cardContracts:[],
    cardAgency:'',
    cardNoticeUnit:'week',
    cardPeriod:'year',
    cardRelocate:'',
  }),
  selects:{ c_currency:{ fallback:'EUR', values:currencyValues } },
  rows:techList,
  rowsKey:'techs',

  fillSelects(){
    fillSelect('c_currency', currencyOptions());
    renderCardContractChips();
  },

  syncConditional(){
    $('c_days_wrap').hidden           = !state.cardModes.includes('hybrid');
    $('c_relocate_cond_wrap').hidden  = !state.cardRelocate || state.cardRelocate === 'no';
    $('c_currency_other_wrap').hidden = $('c_currency').value !== 'other';
  },

  collect:collectCard, render:renderCard, toMarkdown:cardToMarkdown, filename:cardFilename,
};

resetState(DOCS.card);
