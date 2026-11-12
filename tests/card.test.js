/* What the candidate card promises, asserted. */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, fillCard } = require('../tools/harness');

function cardApp(){
  const app = loadApp();
  fillCard(app);
  return app;
}


test('an untouched card marks every answer as missing', () => {
  const app = loadApp();
  app.setMode('card');
  const md = app.cardToMarkdown();
  const empty = app.I18N.en.empty;

  // Nothing is answered for the candidate: no default work mode, contract,
  // agency or relocation answer slips in.
  assert.ok(md.split(empty).length - 1 >= 8, 'expected every unanswered field to say so');
  assert.doesNotMatch(md, /100% remote|Permanent|Accepted|relocating/);
});

test('the full card reaches the export', () => {
  const md = cardApp().cardToMarkdown();

  for(const text of [
    '# Ana Silva, Data Engineer',
    '**Location and timezone:** Lisbon, UTC+0',
    '**Work modes accepted:** 100% remote, Hybrid. At most on site: 2 days per week',
    '**Contract types accepted:** Permanent, Freelance. Self-employed, willing to set up a company',
    '**Hiring through a staffing agency:** Accepted',
    '**Notice period:** 1 month',
    '**Expected salary (gross):** 45000 to 55000 EUR per year',
    '**Relocation:** Depends on the conditions. Only within the EU',
    '- SQL: 7 years\n- Python: 5 years',
  ]){
    assert.ok(md.includes(text), `the card is missing "${text}"`);
  }
});

test('accepted work modes keep a fixed order, whatever order they were picked in', () => {
  const app = cardApp();
  const order = app.DOCS.card.toggles.c_modes.values();
  assert.deepEqual(order, ['remote', 'hybrid', 'onsite']);

  // The toggle stores picks in declared order; collect() relies on it.
  app.state.cardModes = order.filter(v => ['onsite', 'remote'].includes(v));
  assert.equal(app.collectCard().modes, '100% remote, On-site');
});

test('the on-site ceiling only appears when hybrid is accepted', () => {
  const app = cardApp();
  app.state.cardModes = ['remote'];
  assert.doesNotMatch(app.collectCard().modes, /on site/);

  app.state.cardModes = ['hybrid'];
  app.state.cardDaysUnit = 'month';
  assert.equal(app.collectCard().modes, 'Hybrid. At most on site: 2 days per month');
});

test('contract types come from the same list as the job description, minus "other"', () => {
  const app = cardApp();
  const values = app.DOCS.card.toggles.c_contracts.values();
  const jdValues = app.I18N.en.contract_types.map(t => t.v);

  assert.deepEqual(values, jdValues.filter(v => v !== 'other'));

  // The values are what makes a card comparable with a job post later, so
  // every language must offer the same ones.
  for(const lang of Object.keys(app.I18N)){
    assert.deepEqual(app.I18N[lang].contract_types.map(t => t.v), jdValues, `"${lang}" contract values differ`);
  }
});

test('the contract note stands on its own when no type is picked', () => {
  const app = cardApp();
  app.state.cardContracts = [];
  assert.equal(app.collectCard().contracts, 'Self-employed, willing to set up a company');
});

test('the notice period always carries its unit, and zero reads as now', () => {
  const app = cardApp();
  const cases = [
    ['0', 'week',  'Available immediately'],
    ['1', 'week',  '1 week'],
    ['3', 'week',  '3 weeks'],
    ['1', 'month', '1 month'],
    ['2', 'month', '2 months'],
  ];
  for(const [n, unit, expected] of cases){
    app.els.c_notice.value = n;
    app.state.cardNoticeUnit = unit;
    assert.equal(app.collectCard().notice, expected);
  }
});

test('a salary floor alone reads as a floor, not as a broken range', () => {
  const app = cardApp();
  app.els.c_max.value = '';
  assert.equal(app.collectCard().salary, 'From 45000 EUR per year');

  app.els.c_min.value = '';
  app.els.c_max.value = '60000';
  assert.equal(app.collectCard().salary, 'Up to 60000 EUR per year');
});

test('an inverted salary range is flagged on the card too', () => {
  const app = cardApp();
  app.els.c_min.value = '60000';
  app.els.c_max.value = '50000';
  app.render();

  assert.equal(app.collectCard().salaryInverted, true);
  assert.equal(app.els.cardSalaryWarn.hidden, false);
});

test('relocation conditions only appear when relocation is possible', () => {
  const app = cardApp();
  app.state.cardRelocate = 'no';
  assert.equal(app.collectCard().relocate, 'Not open to relocating');

  app.state.cardRelocate = 'yes';
  assert.equal(app.collectCard().relocate, 'Open to relocating. Only within the EU');
});


/* ------------------------------------------------- years per technology -- */

test('technologies are listed most experience first, blank rows dropped', () => {
  const app = cardApp();
  app.techList.set([
    { name:'  dbt ', years:'2' },
    { name:'',       years:'9' },
    { name:'SQL',    years:'7' },
    { name:'Go',     years:'' },
    { name:'Python', years:'7' },
  ]);

  assert.deepEqual(app.collectCard().techs, [
    { name:'SQL',    years:'7 years' },
    { name:'Python', years:'7 years' },
    { name:'dbt',    years:'2 years' },
    { name:'Go',     years:app.I18N.en.empty },
  ]);
});

test('years are kept between 0 and 50, in steps of half a year', () => {
  const app = cardApp();
  const yearsFor = raw => {
    app.techList.set([{ name:'SQL', years:raw }]);
    return app.collectCard().techs[0].years;
  };

  assert.equal(yearsFor('1'), '1 year');
  assert.equal(yearsFor('2.3'), '2.5 years');
  assert.equal(yearsFor('99'), '50 years');
  assert.equal(yearsFor('-3'), '0 years');
  assert.equal(yearsFor('abc'), app.I18N.en.empty);
});

test('a technology listed twice is kept once, and the candidate is told', () => {
  const app = cardApp();
  app.techList.set([
    { name:'SQL', years:'7' },
    { name:'sql', years:'1' },
  ]);
  app.render();

  const f = app.collectCard();
  assert.deepEqual(f.techs, [{ name:'SQL', years:'7 years' }]);
  assert.equal(app.els.techWarn.hidden, false);
  assert.match(app.els.techWarn.textContent, /"sql" is listed more than once/);
});

test('a row holding a list of technologies is flagged, a name with a slash is not', () => {
  const app = cardApp();
  app.techList.set([
    { name:'Python, dbt', years:'4' },
    { name:'CI/CD',       years:'3' },
    { name:'PL/SQL',      years:'2' },
  ]);
  app.render();

  assert.deepEqual(app.collectCard().techLists, ['Python, dbt']);
  assert.match(app.els.techWarn.textContent, /split "Python, dbt"/);
});

test('names are capped and the list cannot grow past its limit', () => {
  const app = cardApp();
  app.techList.set([{ name:'x'.repeat(100), years:'1' }]);
  assert.equal(app.collectCard().techs[0].name.length, 40);

  app.techList.resize(app.MAX_TECHS + 10);
  assert.equal(app.techList.rows.length, app.MAX_TECHS);
  app.render();
  assert.equal(app.els.btnAddTech.disabled, true, 'the add button should stop at the limit');
});


/* ----------------------------------------------------- preview and file -- */

test('the card preview and export never disagree', () => {
  const app = cardApp();
  app.render();
  const preview = app.els.doc.innerHTML;
  const md = app.cardToMarkdown();

  for(const value of ['Ana Silva, Data Engineer', 'Lisbon, UTC+0', '1 month',
                      '45000 to 55000 EUR per year', 'SQL: 7 years']){
    assert.ok(preview.includes(value), `preview is missing "${value}"`);
    assert.ok(md.includes(value), `Markdown is missing "${value}"`);
  }
});

test('card input is escaped in the preview', () => {
  const app = cardApp();
  app.els.c_name.value = '<img src=x onerror=alert(1)>';
  app.techList.set([{ name:'<script>alert(2)</script>', years:'1' }]);
  app.render();

  const preview = app.els.doc.innerHTML;
  assert.ok(!preview.includes('<img') && !preview.includes('<script>'), 'raw markup leaked into the preview');
  assert.ok(preview.includes('&lt;img'));
});

test('switching language translates the card, not what the candidate typed', () => {
  const app = cardApp();

  app.setLang('pt');
  let f = app.collectCard();
  assert.equal(f.modes, '100% remoto, Híbrido. No máximo presencial: 2 dias por semana');
  assert.equal(f.notice, '1 mês');
  assert.equal(f.salary, '45000 a 55000 EUR por ano');
  assert.match(f.contracts, /^Sem termo, Freelancer\. Self-employed/);

  app.setLang('es');
  f = app.collectCard();
  assert.equal(f.notice, '1 mes');
  assert.equal(f.techs[0].years, '7 años');
});

test('the card download is named after the candidate', () => {
  const app = cardApp();
  assert.equal(app.cardFilename(), 'ana-silva-data-engineer.md');

  app.els.c_name.value = '';
  assert.equal(app.cardFilename(), 'candidate-card.md');
  app.setLang('pt');
  assert.equal(app.cardFilename(), 'cartao-do-candidato.md');
});

test('the export follows the open document', () => {
  const app = cardApp();
  assert.equal(app.activeDoc().id, 'card');
  assert.match(app.activeDoc().toMarkdown(), /^# Ana Silva/);

  app.setMode('jd');
  assert.match(app.activeDoc().toMarkdown(), /^# \[Job title\]/);
});
