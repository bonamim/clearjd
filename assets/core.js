/* ClearJD shared engine.
 *
 * Everything the job description and the candidate card have in common:
 * DOM and i18n helpers, toggle groups, dynamic row lists, the preview
 * primitives and salary formatting. Each document is described once, in its
 * own file (jd.js, card.js), and registered in DOCS. app.js wires the page.
 *
 * The flow stays one-directional for every document:
 *   form inputs -> doc.collect() -> { doc.render() to the preview, doc.toMarkdown() to export }
 */
'use strict';

/* Every document the page can produce, keyed by id. Filled in by jd.js and
   card.js. Each entry has the same shape:
     id, prefix       'jd' and 'f_', 'card' and 'c_'
     fieldIds         every static text control, so loading clears them all
     toggles          { rowId: { key, values, multi? } }, the button groups
     defaults         the state each toggle starts in
     rows             the dynamic row list, if the document has one
     collect()        resolve the form into final strings
     render()         draw collect() into the preview
     toMarkdown()     the exported document
     filename()       the download name
     syncConditional  show and hide the fields that depend on another answer */
const DOCS = {};

let lang = 'en';
let mode = 'jd';

/* Toggle state for every document, in one object. Keys are unique across
   documents, so they can share it. */
const state = {};

const $ = id => document.getElementById(id);
const dict = () => I18N[lang];
const val = id => $(id).value.trim();

const escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* "1 day" vs "2 days". */
const plural = (n, one, many) => (Number(n) === 1 ? one : many);

/* Copy a document's defaults into the shared state, cloning arrays so a
   multi-select never mutates the frozen default. */
function resetState(doc){
  for(const [key, value] of Object.entries(doc.defaults)){
    state[key] = Array.isArray(value) ? [...value] : value;
  }
}


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

const currencyValues = () => [...CURRENCIES, 'other'];

const currencyOptions = () => [
  ...CURRENCIES.map(c => ({ v:c, label:c })),
  { v:'other', label:dict().opt_currency_other },
];

/* The currency a pair of controls resolves to: a code from the list, or the
   free-text code when the list does not cover it. */
function currencyValue(selectId, otherId){
  const code = $(selectId).value;
  return code === 'other' ? val(otherId) : code;
}

const periodLabel = period => {
  const d = dict();
  return { year:d.opt_year, month:d.opt_month, hour:d.opt_hour }[period];
};

/**
 * "32000 to 42000 EUR per year". With `open`, a one-sided range reads
 * "From 32000 EUR per year" instead of showing a question mark, which suits
 * a candidate stating a floor.
 */
function formatSalary(min, max, currency, period, { open = false } = {}){
  const d = dict();
  if(!min && !max) return '';

  let amount;
  if(open && min && !max)      amount = `${d.salary_from} ${min}`;
  else if(open && !min && max) amount = `${d.salary_up_to} ${max}`;
  else                         amount = `${min || '?'} ${d.range_to} ${max || '?'}`;

  return `${amount} ${currency} ${periodLabel(period)}`.replace(/\s+/g,' ').trim();
}

const salaryInverted = (min, max) => min !== '' && max !== '' && Number(min) > Number(max);


/* ------------------------------------------------------- toggle groups -- */

/* Reflect state onto one group's buttons. */
function syncToggleRow(rowId, { key, multi }){
  $(rowId).querySelectorAll('button[data-val]').forEach(b=>{
    const on = multi ? state[key].includes(b.dataset.val) : b.dataset.val === state[key];
    b.setAttribute('aria-pressed', String(on));
  });
}

/* Single-select groups behave like radios. Multi-select groups toggle each
   value and keep them in the declared order, so the export does not depend
   on the order the buttons were clicked in. */
function wireToggleGroup(rowId, group, onChange){
  $(rowId).addEventListener('click', e=>{
    const btn = e.target.closest('button[data-val]');
    if(!btn) return;
    const v = btn.dataset.val;

    if(group.multi){
      const on = new Set(state[group.key]);
      on.has(v) ? on.delete(v) : on.add(v);
      state[group.key] = group.values().filter(x => on.has(x));
    } else {
      state[group.key] = v;
    }

    syncToggleRow(rowId, group);
    onChange();
  });
}

/* Toggle values are declared as functions, because some come from the
   translation table (contract types) and the list is read at call time. */
const fixed = (...values) => () => values;


/* ----------------------------------------------------------- row lists -- */

/**
 * A list of rows the user can grow and shrink: interview stages, years per
 * technology. The rows live here rather than in the DOM, because the DOM is
 * rebuilt whenever the count or the language changes.
 *
 * columns: [{ field, cls, type:'text'|'number', attrs, a11y, ph, suffix }]
 *   a11y, ph and suffix are i18n keys; a11y may contain {n}.
 */
function makeRowList({ containerId, max, columns, removable = false, removeKey }){
  const list = {
    rows: [],
    max,

    blank(){
      return Object.fromEntries(columns.map(c => [c.field, '']));
    },

    /* Resize to `count`, keeping whatever has been typed. Shrinking discards
       the trailing rows, growing appends empty ones. */
    resize(count){
      const n = Math.max(0, Math.min(max, Number(count) || 0));
      while(list.rows.length < n) list.rows.push(list.blank());
      list.rows.length = n;
    },

    set(rows){
      list.rows = rows.slice(0, max).map(r => ({ ...list.blank(), ...r }));
    },

    render(){
      const d = dict();
      const a11y = (key, n) => escapeHtml(d[key].replace('{n}', n));

      $(containerId).innerHTML = list.rows.map((row, i) => {
        const cells = columns.map(c => {
          const input = `<input type="${c.type || 'text'}" class="${c.cls}"
             data-row="${i}" data-field="${c.field}" ${c.attrs || ''}
             value="${escapeHtml(row[c.field])}"
             aria-label="${a11y(c.a11y, i + 1)}"
             placeholder="${escapeHtml(d[c.ph])}">`;
          return c.suffix ? `${input}\n      <span class="unit-suffix">${escapeHtml(d[c.suffix])}</span>` : input;
        }).join('\n      ');

        const remove = removable
          ? `\n      <button type="button" class="row-remove" data-remove="${i}" aria-label="${a11y(removeKey, i + 1)}">×</button>`
          : '';

        return `
    <div class="stage-row">
      <span class="stage-badge" aria-hidden="true">${i + 1}</span>
      ${cells}${remove}
    </div>`;
      }).join('');
    },

    /* Typing in a row updates the model; removing a row rebuilds the list. */
    wire(onChange){
      const el = $(containerId);
      el.addEventListener('input', e=>{
        const input = e.target.closest('[data-row]');
        if(!input) return;
        list.rows[Number(input.dataset.row)][input.dataset.field] = input.value;
        onChange();
      });
      el.addEventListener('click', e=>{
        const btn = e.target.closest('button[data-remove]');
        if(!btn) return;
        list.rows.splice(Number(btn.dataset.remove), 1);
        list.render();
        onChange({ rebuilt:true });
      });
    },
  };
  return list;
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

const previewRow = (label, value) => `<p><span class="k">${label}</span> ${mark(value)}</p>`;

const previewBullets = items => items.length
  ? items.map(i=>`<p><span class="bullet">•</span> <span class="v">${escapeHtml(i)}</span></p>`).join('')
  : `<p class="empty">${dict().empty}</p>`;

/* Lowercase ASCII slug for a download name, keeping accented words readable. */
function slugify(text, fallback){
  const slug = (text || fallback)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
  return `${slug || fallback}.md`;
}
