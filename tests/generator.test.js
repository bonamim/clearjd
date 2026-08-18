/* What the generator promises, asserted.
 *
 * Run with: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, fillExample } = require('../tools/harness');


test('every language defines exactly the same keys', () => {
  const { I18N } = loadApp();
  const langs = Object.keys(I18N);
  const expected = Object.keys(I18N.en).sort();

  assert.ok(langs.length >= 3, 'expected at least en, pt and es');

  for(const lang of langs){
    assert.deepEqual(
      Object.keys(I18N[lang]).sort(), expected,
      `"${lang}" does not match the English key set. A new language must translate every key.`
    );
  }
});

test('every i18n key used in the markup exists', () => {
  const { I18N, html } = loadApp();
  const used = [...html.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)]
    .map(m => m[1])
    .filter(k => k !== 'h1');   // built from h1_pre + h1_post

  for(const key of new Set(used)){
    assert.ok(I18N.en[key] !== undefined, `markup references unknown i18n key "${key}"`);
  }
});

test('every form control has an associated label', () => {
  const { html } = loadApp();

  // Text inputs and textareas need a <label for>.
  const controls = [...html.matchAll(/<(?:input|textarea)[^>]*id="([a-zA-Z_]+)"/g)]
    .map(m => m[1])
    .filter(id => id !== 'created');

  for(const id of controls){
    assert.ok(
      html.includes(`for="${id}"`),
      `input #${id} has no <label for="${id}">, so screen readers cannot announce it`
    );
  }

  // Button groups stand in for radios, so they need aria-labelledby instead.
  const groups = [...html.matchAll(/<div class="radio-row" id="([a-zA-Z_]+)"([^>]*)>/g)];
  assert.ok(groups.length > 0, 'expected some toggle groups');
  for(const [, id, attrs] of groups){
    assert.match(attrs, /aria-labelledby="/, `toggle group #${id} is missing aria-labelledby`);
  }
});


test('numbers are never emitted without their unit', () => {
  const app = loadApp();
  const { collect, state } = app;
  fillExample(app);

  state.mode = 'hybrid';
  state.daysUnit = 'week';
  state.test = 'home';
  state.testUnit = 'hours';

  const f = collect();

  // The whole point: "2" alone is meaningless, "2 days per week" is not.
  assert.match(f.mode, /2 days per week/);
  assert.match(f.test, /\(4 hours\)/);
  assert.match(f.stages, /^3 stages/);
  assert.match(f.salary, /32000 to 42000 EUR per year/);
});

test('units switch with the toggle', () => {
  const app = loadApp();
  const { collect, state } = app;
  fillExample(app);

  state.mode = 'hybrid';
  state.daysUnit = 'month';
  state.test = 'live';
  state.testUnit = 'days';
  state.period = 'hour';

  const f = collect();
  assert.match(f.mode, /2 days per month/);
  assert.match(f.test, /Live coding \(4 days\)/);
  assert.match(f.salary, /per hour/);
});

test('counts are singular when they should be', () => {
  const app = loadApp();
  const { collect, state, els } = app;
  fillExample(app);

  els.f_stages_count.value = '1';
  app.setStageCount(0);          // no breakdown, just the count
  els.f_days.value = '1';
  els.f_feedback_days.value = '1';
  state.mode = 'hybrid';

  const f = collect();
  assert.equal(f.stages, '1 stage');
  assert.match(f.mode, /1 day per week/);
  assert.match(f.feedback, /1 working day\b/);
});

test('the stage list resizes without losing what was typed', () => {
  const app = loadApp();

  app.setStageCount(3);
  app.getStages()[0].what = 'HR screening';
  app.getStages()[2].what = 'Team fit';

  // Growing keeps existing rows.
  app.setStageCount(4);
  assert.equal(app.getStages().length, 4);
  assert.equal(app.getStages()[0].what, 'HR screening');

  // Shrinking drops the trailing rows.
  app.setStageCount(2);
  assert.equal(app.getStages().length, 2);
  assert.equal(app.getStages()[0].what, 'HR screening');

  // Growing again does not resurrect what was dropped.
  app.setStageCount(3);
  assert.equal(app.getStages()[2].what, '');
});

test('the stage count is clamped to something sane', () => {
  const app = loadApp();

  app.setStageCount(999);
  assert.equal(app.getStages().length, app.MAX_STAGES);

  app.setStageCount(-5);
  assert.equal(app.getStages().length, 0);

  app.setStageCount('not a number');
  assert.equal(app.getStages().length, 0);
});

test('stages without a description are skipped in the breakdown', () => {
  const app = loadApp();
  app.setStageCount(3);
  app.getStages()[0].what = 'HR screening'; app.getStages()[0].minutes = '30';
  app.getStages()[2].what = 'Team fit';     // no duration given
  app.els.f_stages_count.value = '3';

  const stages = app.collect().stages;
  assert.match(stages, /^3 stages\. /);
  assert.match(stages, /1\. HR screening \(30min\)/);

  // A stage with no duration must not render empty brackets.
  assert.match(stages, /3\. Team fit$/);

  // Numbering follows the actual stage position, so skipping stage 2 shows
  // as a visible gap rather than being silently renumbered.
  assert.doesNotMatch(stages, /2\. /);
});

test('feedback timing reaches the reader', () => {
  const app = loadApp();
  app.els.f_feedback_days.value = '5';
  app.els.f_decision_days.value = '10';

  const f = app.collect();
  assert.match(f.feedback, /5 working days of each stage/);
  assert.match(f.feedback, /Final decision within 10 working days/);

  // Each half is optional on its own.
  app.els.f_feedback_days.value = '';
  assert.doesNotMatch(app.collect().feedback, /each stage/);
  assert.match(app.collect().feedback, /Final decision/);
});

test('on-site days only appear for hybrid roles', () => {
  const app = loadApp();
  const { collect, state } = app;
  fillExample(app);

  state.mode = 'remote';
  assert.doesNotMatch(collect().mode, /2 days/, 'a fully remote role must not mention on-site days');

  state.mode = 'onsite';
  assert.doesNotMatch(collect().mode, /2 days/);
});

test('assessment time only appears when there is an assessment', () => {
  const app = loadApp();
  const { collect, state } = app;
  fillExample(app);

  state.test = 'none';
  assert.doesNotMatch(collect().test, /4/, '"None" must not carry an estimated time');
});

test('the end client only appears when hiring goes through an agency', () => {
  const app = loadApp();
  const { collect, state } = app;
  fillExample(app);

  state.bond = 'direct';
  assert.doesNotMatch(collect().bond, /Acme Corp/);

  state.bond = 'agency';
  assert.match(collect().bond, /Acme Corp/);
});


test('an inverted salary range is flagged', () => {
  const app = loadApp();
  const { collect, els } = app;
  fillExample(app);

  assert.equal(collect().salaryInverted, false);

  els.f_min.value = '50000';
  assert.equal(collect().salaryInverted, true, '50000 to 42000 should be reported as inverted');

  // A half-filled range is incomplete, not inverted.
  els.f_max.value = '';
  assert.equal(collect().salaryInverted, false);
});

test('the salary warning is shown and cleared in the preview', () => {
  const app = loadApp();
  const { render, els } = app;
  fillExample(app);

  render();
  assert.equal(els.salaryWarn.hidden, true);
  assert.equal(els.f_min.getAttribute('aria-invalid'), 'false');

  els.f_min.value = '50000';
  render();
  assert.equal(els.salaryWarn.hidden, false);
  assert.equal(els.f_min.getAttribute('aria-invalid'), 'true');
});


test('the Markdown export carries every essential field', () => {
  const app = loadApp();
  const { toMarkdown, I18N } = app;
  fillExample(app);

  const md = toMarkdown();
  const d = I18N.en;

  for(const heading of [d.doc_essentials, d.doc_stack, d.doc_expect]){
    assert.ok(md.includes(`## ${heading}`), `missing section "${heading}"`);
  }
  for(const field of [d.doc_stages, d.doc_test, d.doc_mode, d.doc_tz,
                      d.doc_contract, d.doc_bond, d.doc_salary, d.doc_benefits]){
    assert.ok(md.includes(`**${field}**`), `missing field "${field}"`);
  }

  assert.ok(md.startsWith('# Data Engineer (Snowflake)'));
  assert.ok(md.includes('- Design reliable pipelines'));
  assert.ok(md.includes('- Document what you build'));
});

test('empty fields are marked, never silently dropped', () => {
  const { toMarkdown, I18N } = loadApp();

  // A missing field must look deliberate, not like an oversight.
  const md = toMarkdown();
  const occurrences = md.split(I18N.en.empty).length - 1;
  assert.ok(occurrences >= 6, `expected untouched fields to be marked "${I18N.en.empty}"`);
});

test('the preview and the export never disagree', () => {
  const app = loadApp();
  const { render, toMarkdown, els } = app;
  fillExample(app);
  render();

  const preview = els.doc.innerHTML;
  const md = toMarkdown();

  // Both read from collect(), so every value must appear in both.
  for(const value of ['Data Engineer (Snowflake)', '3 stages', 'At least 4h overlap with UTC',
                      'Permanent', '32000 to 42000 EUR per year', 'Health insurance']){
    assert.ok(preview.includes(value), `preview is missing "${value}"`);
    assert.ok(md.includes(value), `Markdown is missing "${value}"`);
  }
});


test('user input is escaped in the preview', () => {
  const app = loadApp();
  const { render, els } = app;
  fillExample(app);

  els.f_title.value = '<img src=x onerror=alert(1)>';
  els.f_benefits.value = '<script>alert(2)</script>';
  render();

  const preview = els.doc.innerHTML;
  assert.ok(!preview.includes('<img'), 'raw markup leaked into the preview');
  assert.ok(!preview.includes('<script>'), 'raw markup leaked into the preview');
  assert.ok(preview.includes('&lt;img'), 'expected the input to be escaped, not stripped');
});

test('blank lines in the expectations list are dropped', () => {
  const app = loadApp();
  const { collect, els } = app;
  fillExample(app);

  els.f_expect.value = 'First point\n\n   \nSecond point\n';
  assert.deepEqual(collect().expect, ['First point', 'Second point']);
});


test('the download filename is a clean slug', () => {
  const { filename, els } = loadApp();

  els.f_title.value = 'Data Engineer (Snowflake)';
  assert.equal(filename(), 'data-engineer-snowflake.md');

  // Accented titles must stay readable rather than turning into dashes.
  els.f_title.value = 'Engenheiro de Dados Sénior';
  assert.equal(filename(), 'engenheiro-de-dados-senior.md');

  els.f_title.value = '';
  assert.equal(filename(), 'job-description.md');

  // A title with nothing sluggable still yields a usable name.
  els.f_title.value = '!!!';
  assert.equal(filename(), 'job-description.md');
});


test('switching language translates the generated document', () => {
  const app = loadApp();
  const { collect, setLang, state } = app;
  fillExample(app);
  state.mode = 'hybrid';
  state.bond = 'agency';

  setLang('pt');
  let f = collect();
  assert.match(f.stages, /3 fases/);
  assert.match(f.mode, /2 dias por semana/);
  assert.match(f.salary, /32000 a 42000 EUR por ano/);
  assert.match(f.bond, /consultora/);

  setLang('es');
  f = collect();
  assert.match(f.stages, /3 fases/);
  assert.match(f.mode, /2 días por semana/);
  assert.match(f.salary, /por año/);
});

test('the placeholder title is translated too', () => {
  const { collect, setLang, I18N, els } = loadApp();
  els.f_title.value = '';

  for(const lang of Object.keys(I18N)){
    setLang(lang);
    assert.equal(collect().title, I18N[lang].doc_title_ph);
  }
});
