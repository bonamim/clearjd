/* Guards that make the suite grow with the project.
 *
 * The other test files check behaviour that exists today. These check that
 * new work does not slip in untested: a field that is never exported, a
 * translation that was half-added, a control nobody can reach with a
 * keyboard. They fail on the *absence* of work rather than on a bug.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadApp, fillExample, fillCard, read, ROOT } = require('../tools/harness');


/* How each document is put into the state where every conditional field is
   live, so a field is only ever missing from the export because it was not
   wired up. A document added to DOCS must be added here too. */
const DOC_CASES = {
  jd: {
    fill: fillExample,
    live: app => { app.state.test = 'home'; app.state.mode = 'hybrid'; app.state.bond = 'agency'; },
    numeric: /days|time|min|max/,
    skip: new Set([
      'f_stages_count',      // becomes "3 stages", not the raw number
      'f_contract',          // a select value, exported as its label
      'f_currency',          // a select value, exported as the code
      'f_contract_other',    // only used when contract type is "other"
      'f_currency_other',    // only used when currency is "other"
    ]),
  },
  card: {
    fill: fillCard,
    live: app => { app.state.cardModes = ['hybrid']; app.state.cardRelocate = 'depends'; },
    numeric: /days|notice|min|max/,
    skip: new Set([
      'c_currency',          // a select value, exported as the code
      'c_currency_other',    // only used when currency is "other"
    ]),
  },
};

test('every document has a completeness case', () => {
  const { DOCS } = loadApp();
  for(const id of Object.keys(DOCS)){
    assert.ok(DOC_CASES[id], `document "${id}" has no entry in DOC_CASES, so nothing checks its fields reach the export`);
  }
});

test('every form field reaches the exported document', () => {
  for(const [docId, c] of Object.entries(DOC_CASES)){
    const app = loadApp();
    c.fill(app);
    c.live(app);
    const doc = app.DOCS[docId];

    // Give every field a value that could not appear by accident, then check
    // each one survives into the Markdown. A new field wired into the form
    // but not into collect() fails here.
    for(const id of doc.fieldIds){
      if(c.skip.has(id)) continue;

      const marker = `ZZ${id}ZZ`;
      const isNumeric = c.numeric.test(id);
      app.els[id].value = isNumeric ? '7' : marker;

      const md = doc.toMarkdown();
      const expected = isNumeric ? '7' : marker;

      assert.ok(
        md.includes(expected),
        `field "${id}" never reaches the exported ${docId} Markdown. Wire it into collect() and toMarkdown().`
      );
    }
  }
});

test('every listed field exists in the markup', () => {
  const { DOCS, html } = loadApp();

  for(const doc of Object.values(DOCS)){
    for(const id of doc.fieldIds){
      assert.ok(
        html.includes(`id="${id}"`),
        `${doc.id} lists field "${id}", which is not in index.html. Remove it or add the control.`
      );
      assert.ok(id.startsWith(doc.prefix), `${doc.id} field "${id}" does not use the "${doc.prefix}" prefix`);
    }
  }
});

test('every text control in the markup belongs to a document', () => {
  const { DOCS, html } = loadApp();

  // Every control, whatever its id, so a field with a new prefix cannot slip
  // past the checks above. Dynamic rows are built at runtime and held in
  // their own model, so they never appear in the static markup.
  const controls = [...html.matchAll(/<(?:input|select|textarea)[^>]*id="([a-zA-Z_]+)"/g)].map(m => m[1]);
  const owned = new Map(Object.values(DOCS).flatMap(doc => doc.fieldIds.map(id => [id, doc.id])));

  assert.ok(controls.length > 20, 'expected the forms to have controls');
  for(const id of controls){
    assert.ok(
      owned.has(id),
      `control #${id} is in the form but in no document's field list, so loading an example or a link will not clear it`
    );
  }
});

test('every interactive control can be reached and understood', () => {
  const { html } = loadApp();

  // Buttons need either visible text, a translation key, or an aria-label.
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  assert.ok(buttons.length > 5, 'expected the form to have buttons');

  for(const [, attrs, body] of buttons){
    const labelled = /data-i18n=/.test(attrs)
      || /aria-label=/.test(attrs)
      || body.replace(/<[^>]*>/g, '').trim().length > 0;
    assert.ok(labelled, `a button has no accessible name: <button${attrs}>`);

    // Every button is explicitly type="button": a stray submit would reload
    // the page and lose everything the user typed.
    assert.match(attrs, /type="button"/, `a button is missing type="button": <button${attrs}>`);
  }
});

test('each select is labelled', () => {
  const { html } = loadApp();
  const selects = [...html.matchAll(/<select[^>]*id="([a-zA-Z_]+)"/g)].map(m => m[1]);

  assert.ok(selects.length > 0, 'expected the form to use selects');
  for(const id of selects){
    assert.ok(html.includes(`for="${id}"`), `select #${id} has no <label for="${id}">`);
  }
});

test('every on-screen hint is announced, not just shown', () => {
  const { html } = loadApp();

  // A hint that only exists visually gives sighted users guidance that screen
  // reader users never hear.
  // Validation messages are excluded: they carry role="alert", which is
  // announced when they appear, and the field they belong to gets
  // aria-invalid. That is the right pattern for an error, not describedby.
  const hints = [...html.matchAll(/<(?:span|p) class="(hint[^"]*)"([^>]*)>/g)]
    .filter(m => !m[1].split(/\s+/).includes('warn'))
    .map(m => m[2]);

  const described = new Set(
    [...html.matchAll(/aria-describedby="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/))
  );

  for(const attrs of hints){
    const id = (attrs.match(/id="([^"]+)"/) || [])[1];
    assert.ok(id, `a hint has no id, so nothing can reference it: <span class="hint"${attrs}>`);
    assert.ok(
      described.has(id),
      `hint #${id} is shown but no control references it with aria-describedby`
    );
  }
});

test('no translation is left as a copy of the English source', () => {
  const { I18N } = loadApp();

  // Some values are legitimately identical across languages: proper nouns,
  // codes, and terms borrowed as-is.
  const shared = new Set([
    'ph_tz', 'ph_required', 'ph_nice', 'ph_stage_minutes',
    'opt_test_live', 'opt_test_home',
    'opt_no', 'unit_minutes', 'btn_copied',
  ]);

  for(const lang of Object.keys(I18N)){
    if(lang === 'en') continue;

    const copied = Object.keys(I18N.en).filter(key => {
      if(shared.has(key)) return false;
      const a = I18N.en[key], b = I18N[lang][key];
      return typeof a === 'string' && typeof b === 'string'
        && a === b && a.length > 12;
    });

    assert.deepEqual(
      copied, [],
      `"${lang}" still has untranslated English in: ${copied.join(', ')}`
    );
  }
});

test('every link points at the real repository', () => {
  const pkg = JSON.parse(read('package.json'));
  const repo = pkg.repository.url.replace(/\.git$/, '');
  const pages = pkg.homepage.replace(/\/$/, '');

  // The repo and Pages URLs are repeated across the site, the docs and the
  // exported Markdown. package.json is the one that decides.
  const files = ['index.html', 'README.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
                 'TEMPLATE.md', 'CARD.md', 'assets/i18n.js', '.github/CODEOWNERS'];

  for(const file of files){
    const source = read(file);

    for(const [url] of source.matchAll(/https:\/\/[a-z0-9.-]*github\.(?:com|io)[^\s"')\]]*/gi)){
      const ok = url.startsWith(repo) || url.startsWith(pages);
      assert.ok(ok, `${file} links to ${url}, which is neither ${repo} nor ${pages}`);
    }

  }

  // Owners must be real handles. Comments in that file mention "@handle"
  // as prose, so only the rule lines are checked.
  const owner = repo.split('/').at(-2);
  const ownerLines = read('.github/CODEOWNERS')
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'));

  assert.ok(ownerLines.length > 0, 'CODEOWNERS has no rules');
  for(const line of ownerLines){
    for(const [, handle] of line.matchAll(/@([A-Za-z0-9][A-Za-z0-9-]*)/g)){
      assert.equal(
        handle, owner,
        `CODEOWNERS assigns @${handle}, but the repository belongs to @${owner}`
      );
    }
  }

  // Generated examples carry the Pages URL too.
  const examplesDir = path.join(ROOT, 'examples');
  for(const file of fs.readdirSync(examplesDir).filter(f => f.endsWith('.md'))){
    const source = fs.readFileSync(path.join(examplesDir, file), 'utf8');
    for(const [url] of source.matchAll(/https:\/\/[a-z0-9.-]*github\.(?:com|io)[^\s"')\]]*/gi)){
      assert.ok(url.startsWith(pages), `examples/${file} links to ${url}, not ${pages}`);
    }
  }
});

test('TEMPLATE.md documents every field the generator emits', () => {
  const { I18N } = loadApp();
  const template = read('TEMPLATE.md');

  // Someone filling the template by hand and someone using the generator must
  // end up with the same document. If a field is added to one and not the
  // other, the standard quietly forks in two.
  const fields = ['doc_stages', 'doc_test', 'doc_feedback', 'doc_mode', 'doc_tz',
                  'doc_contract', 'doc_bond', 'doc_salary', 'doc_benefits'];

  for(const key of fields){
    const label = I18N.en[key];
    assert.ok(
      template.includes(`**${label}**`),
      `TEMPLATE.md is missing "${label}", which the generator emits. ` +
      `The hand-written template and the tool would produce different documents.`
    );
  }

  for(const heading of [I18N.en.doc_stack, I18N.en.doc_expect]){
    assert.ok(template.includes(`## ${heading}`), `TEMPLATE.md is missing the "${heading}" section`);
  }
});

test('CARD.md documents every field the card emits', () => {
  const { I18N } = loadApp();
  const template = read('CARD.md');

  // The same rule as for TEMPLATE.md: filling the card by hand and using the
  // generator must give the same document.
  const d = I18N.en;
  for(const key of ['doc_card_location', 'doc_card_modes', 'doc_card_contracts', 'doc_card_agency',
                    'doc_card_notice', 'doc_card_salary', 'doc_card_relocate']){
    assert.ok(template.includes(`**${d[key]}**`), `CARD.md is missing "${d[key]}", which the generator emits`);
  }
  for(const heading of [d.doc_card_conditions, d.doc_card_tech]){
    assert.ok(template.includes(`## ${heading}`), `CARD.md is missing the "${heading}" section`);
  }
});

test('the hand-written templates state the current version', () => {
  const { CLEARJD_VERSION } = loadApp();
  for(const file of ['TEMPLATE.md', 'CARD.md']){
    assert.ok(read(file).includes(`v${CLEARJD_VERSION}`), `${file} does not state v${CLEARJD_VERSION}`);
  }
});

test('the generated document has no leftover placeholders', () => {
  const app = loadApp();

  for(const example of app.EXAMPLES){
    app.loadExample(example.id);
    const md = app.activeDoc().toMarkdown();

    assert.doesNotMatch(md, /\{[a-z]\}/, `example "${example.id}" left an unfilled {placeholder}`);
    assert.doesNotMatch(md, /\[.*?\]\s*$/m, `example "${example.id}" left a [bracketed] template value`);
    assert.doesNotMatch(md, /undefined|NaN|\[object/, `example "${example.id}" leaked a JavaScript value`);
  }
});
