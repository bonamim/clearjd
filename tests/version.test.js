/* The standard is versioned, and every place that states the version must
 * agree. A job post stamped "v1.2.0" has to mean one specific field set.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, read } = require('../tools/harness');

const SEMVER = /^\d+\.\d+\.\d+$/;


test('the version is valid semver', () => {
  const { CLEARJD_VERSION } = loadApp();
  assert.match(CLEARJD_VERSION, SEMVER);
});

test('package.json and assets/version.js agree', () => {
  const { CLEARJD_VERSION } = loadApp();
  const pkg = JSON.parse(read('package.json'));

  assert.equal(
    pkg.version, CLEARJD_VERSION,
    'package.json and assets/version.js state different versions'
  );
});

test('the changelog documents the current version', () => {
  const { CLEARJD_VERSION } = loadApp();
  const changelog = read('CHANGELOG.md');

  assert.ok(
    changelog.includes(`## [${CLEARJD_VERSION}]`),
    `CHANGELOG.md has no entry for ${CLEARJD_VERSION}. Every release needs one.`
  );
});

test('the changelog lists the current version first', () => {
  const { CLEARJD_VERSION } = loadApp();
  const versions = [...read('CHANGELOG.md').matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map(m => m[1]);

  assert.ok(versions.length > 0, 'CHANGELOG.md has no released versions');
  assert.equal(
    versions[0], CLEARJD_VERSION,
    'the newest changelog entry is not the current version'
  );
});

test('generated job descriptions carry the version', () => {
  const app = loadApp();
  app.loadExample('data-engineer-portugal');

  assert.ok(
    app.toMarkdown().includes(`v${app.CLEARJD_VERSION}`),
    'the exported Markdown must state which version of the template it follows'
  );
});

test('every language stamps the version', () => {
  const app = loadApp();

  for(const lang of Object.keys(app.I18N)){
    assert.ok(
      app.I18N[lang].doc_footer.includes('{v}'),
      `the "${lang}" footer drops the {v} placeholder, so posts would not state a version`
    );
  }
});
