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
const { loadApp, fillExample, read, ROOT } = require('../tools/harness');


test('every form field reaches the exported document', () => {
  const app = loadApp();
  fillExample(app);

  // Put the form in the state where every conditional field is live, so a
  // field is only ever missing because it was not wired up.
  app.state.test = 'home';
  app.state.mode = 'hybrid';
  app.state.bond = 'agency';

  // Give every field a value that could not appear by accident, then check
  // each one survives into the Markdown. A new field wired into the form but
  // not into collect() fails here.
  const skip = new Set([
    'f_stages_count',      // becomes "3 stages", not the raw number
    'f_contract',          // a select value, exported as its label
    'f_currency',          // a select value, exported as the code
    'f_contract_other',    // only used when contract type is "other"
    'f_currency_other',    // only used when currency is "other"
  ]);

  for(const id of app.FIELD_IDS){
    if(skip.has(id)) continue;

    const marker = `ZZ${id}ZZ`;
    const isNumeric = /days|time|min|max/.test(id);
    app.els[id].value = isNumeric ? '7' : marker;

    const md = app.toMarkdown();
    const expected = isNumeric ? '7' : marker;

    assert.ok(
      md.includes(expected),
      `field "${id}" never reaches the exported Markdown. Wire it into collect() and toMarkdown().`
    );
  }
});

test('every field listed in FIELD_IDS exists in the markup', () => {
  const { FIELD_IDS, html } = loadApp();

  for(const id of FIELD_IDS){
    assert.ok(
      html.includes(`id="${id}"`),
      `FIELD_IDS names "${id}", which is not in index.html. Remove it or add the control.`
    );
  }
});

test('every text control in the markup is listed in FIELD_IDS', () => {
  const { FIELD_IDS, html } = loadApp();

  // Dynamic stage rows are built at runtime and held in their own model, so
  // they are not part of the static field list.
  const dynamic = new Set(['stageList']);

  const controls = [...html.matchAll(/<(?:input|select|textarea)[^>]*id="(f_[a-zA-Z_]+)"/g)]
    .map(m => m[1])
    .filter(id => !dynamic.has(id));

  for(const id of controls){
    assert.ok(
      FIELD_IDS.includes(id),
      `control #${id} is in the form but missing from FIELD_IDS, so loading an example will not clear it`
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

test('no translation is left as a copy of the English source', () => {
  const { I18N } = loadApp();

  // Some values are legitimately identical across languages: proper nouns,
  // codes, and terms borrowed as-is.
  const shared = new Set([
    'ph_tz', 'ph_required', 'ph_nice', 'ph_stage_minutes',
    's_stack', 'opt_test_live', 'opt_test_home',
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
                 'TEMPLATE.md', 'assets/i18n.js', '.github/CODEOWNERS'];

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

test('the generated document has no leftover placeholders', () => {
  const app = loadApp();

  for(const example of app.EXAMPLES){
    app.loadExample(example.id);
    const md = app.toMarkdown();

    assert.doesNotMatch(md, /\{[a-z]\}/, `example "${example.id}" left an unfilled {placeholder}`);
    assert.doesNotMatch(md, /\[.*?\]\s*$/m, `example "${example.id}" left a [bracketed] template value`);
    assert.doesNotMatch(md, /undefined|NaN|\[object/, `example "${example.id}" leaked a JavaScript value`);
  }
});
