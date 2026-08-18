#!/usr/bin/env node
/* Render every entry in assets/examples.js into examples/<id>.md.
 *
 * The examples on the site and the files in the repository are the same data,
 * so they cannot disagree. Run this after editing assets/examples.js:
 *
 *   npm run examples
 *
 * `npm test` fails if the committed files do not match what this produces.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadApp, renderExample, ROOT } = require('./harness');

const outDir = path.join(ROOT, 'examples');
fs.mkdirSync(outDir, { recursive: true });

const app = loadApp();
const written = [];

for(const example of app.EXAMPLES){
  const file = path.join(outDir, `${example.id}.md`);
  fs.writeFileSync(file, renderExample(app, example.id), 'utf8');
  written.push(path.relative(ROOT, file));
}

// Drop files for examples that no longer exist.
const expected = new Set(app.EXAMPLES.map(e => `${e.id}.md`));
for(const file of fs.readdirSync(outDir)){
  if(file.endsWith('.md') && !expected.has(file)){
    fs.unlinkSync(path.join(outDir, file));
    console.log(`removed  examples/${file}`);
  }
}

written.forEach(f => console.log(`wrote    ${f}`));
console.log(`\n${written.length} example(s) generated from assets/examples.js`);
