/* The examples on the site and the files in examples/ are one dataset.
 * These tests fail if they ever drift apart.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadApp, renderExample, ROOT } = require('../tools/harness');

const EXAMPLES_DIR = path.join(ROOT, 'examples');
const REGENERATE = 'run `npm run examples` and commit the result';


test('the committed example files match what the generator produces', () => {
  const app = loadApp();

  for(const example of app.EXAMPLES){
    const file = path.join(EXAMPLES_DIR, `${example.id}.md`);
    assert.ok(fs.existsSync(file), `examples/${example.id}.md is missing, ${REGENERATE}`);

    assert.equal(
      fs.readFileSync(file, 'utf8'),
      renderExample(app, example.id),
      `examples/${example.id}.md is out of date, ${REGENERATE}`
    );
  }
});

test('there are no orphaned example files', () => {
  const { EXAMPLES } = loadApp();
  const expected = new Set(EXAMPLES.map(e => `${e.id}.md`));
  const onDisk = fs.readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.md'));

  for(const file of onDisk){
    assert.ok(expected.has(file), `examples/${file} has no entry in assets/examples.js, ${REGENERATE}`);
  }
});

test('each example is well formed', () => {
  const { EXAMPLES, I18N, DOCS } = loadApp();
  const ids = new Set();

  for(const e of EXAMPLES){
    assert.match(e.id, /^[a-z0-9-]+$/, `example id "${e.id}" should be a lowercase slug`);
    assert.ok(!ids.has(e.id), `duplicate example id "${e.id}"`);
    ids.add(e.id);

    assert.ok(e.label && e.note, `example "${e.id}" needs a label and a note for its chip`);
    assert.ok(I18N[e.lang], `example "${e.id}" uses unknown language "${e.lang}"`);

    const doc = DOCS[e.doc || 'jd'];
    assert.ok(doc, `example "${e.id}" is for unknown document "${e.doc}"`);
    for(const key of Object.keys(e.fields)){
      assert.ok(doc.fieldIds.includes(key), `example "${e.id}" sets unknown ${doc.id} field "${key}"`);
    }
    for(const key of Object.keys(e.state || {})){
      assert.ok(Object.hasOwn(doc.defaults, key), `example "${e.id}" sets unknown ${doc.id} toggle "${key}"`);
    }
  }
});

test('the examples cover genuinely different situations', () => {
  const { EXAMPLES } = loadApp();
  const jds = EXAMPLES.filter(e => (e.doc || 'jd') === 'jd');
  const cards = EXAMPLES.filter(e => e.doc === 'card');

  // The set exists to stress-test the template, so it should not be three
  // variations of the same job post.
  const shapes = new Set(jds.map(e => {
    const s = { ...e.state };
    return [s.mode, s.bond, s.period, s.test].join('/');
  }));
  assert.equal(shapes.size, jds.length, 'two examples describe the same shape of role');

  const cardShapes = new Set(cards.map(e =>
    [e.state.cardModes.join('+'), e.state.cardContracts.join('+'), e.state.cardPeriod].join('/')));
  assert.equal(cardShapes.size, cards.length, 'two candidate cards describe the same candidate');
  assert.ok(cards.length >= 2, 'expected at least two candidate card examples');

  for(const set of [jds, cards]){
    const langs = new Set(set.map(e => e.lang));
    assert.ok(langs.size >= 2, 'the examples should not all be in one language');
  }
});

test('loading an example clears fields the previous one had set', () => {
  const app = loadApp();

  // The Poland example sets an end client, the Portugal one does not.
  app.loadExample('backend-engineer-b2b-poland');
  assert.match(app.collect().bond, /Nordic fintech/);

  app.loadExample('data-engineer-portugal');
  assert.doesNotMatch(app.collect().bond, /Nordic fintech/, 'a stale value leaked between examples');
  assert.doesNotMatch(app.collect().test, /3 hours/, 'a stale value leaked between examples');
});

test('loading a card example after a job example switches document and clears the card', () => {
  const app = loadApp();

  app.loadExample('candidate-backend-engineer-poland');
  assert.equal(app.getMode(), 'card');
  app.loadExample('data-engineer-portugal');
  assert.equal(app.getMode(), 'jd');

  app.loadExample('candidate-data-engineer-portugal');
  assert.doesNotMatch(app.cardToMarkdown(), /Kafka|Kraków/, 'a stale value leaked between card examples');
});

test('every example fills in every essential field', () => {
  const app = loadApp();

  for(const example of app.EXAMPLES){
    app.loadExample(example.id);
    const empty = app.I18N[example.lang].empty;
    const md = app.activeDoc().toMarkdown();

    assert.ok(
      !md.includes(empty),
      `example "${example.id}" leaves a field unfilled, which defeats the point of an example`
    );
  }
});
