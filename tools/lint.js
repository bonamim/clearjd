#!/usr/bin/env node
/* A small, dependency-free check.
 *
 *   npm run lint
 *
 * This is deliberately not ESLint. The project ships no dependencies and its
 * contributors include people who are here to fix a translation, not to set
 * up a toolchain. Node can already parse a file and tell us if it is broken,
 * and the test suite covers the rules that actually matter for this codebase
 * (translations complete, examples in sync, versions agreeing, fields wired
 * up, controls labelled).
 *
 * What is left is the handful of things that bite a plain-script project and
 * that a test cannot see. Each rule below exists because it would cause a
 * real problem, not because a style guide says so.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const problems = [];

const report = (file, message) => problems.push(`${file}: ${message}`);

/** Every .js file we own, ignoring generated and vendored directories. */
function jsFiles(){
  const skip = new Set(['node_modules', '.git', 'examples']);
  const found = [];

  (function walk(dir){
    for(const entry of fs.readdirSync(dir, { withFileTypes:true })){
      if(entry.name.startsWith('.') || skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if(entry.isDirectory()) walk(full);
      else if(entry.name.endsWith('.js')) found.push(full);
    }
  })(ROOT);

  return found;
}

for(const file of jsFiles()){
  const rel = path.relative(ROOT, file);
  const source = fs.readFileSync(file, 'utf8');

  // 1. It has to parse. Node does this better than any linter could.
  try{
    execFileSync(process.execPath, ['--check', file], { stdio:'pipe' });
  }catch(err){
    report(rel, `does not parse\n${err.stderr.toString().trim()}`);
    continue;
  }

  // 2. Strict mode. Without it a typo silently creates a global, and these
  //    files share one scope in the browser.
  if(!/^\s*(?:\/\*[\s\S]*?\*\/\s*)*(?:\/\/.*\n\s*)*'use strict';/m.test(source)){
    report(rel, "is missing 'use strict'");
  }

  // 3. Nothing left behind from debugging.
  if(/^\s*debugger\b/m.test(source)) report(rel, 'contains a debugger statement');

  // 4. Tabs mix badly with the spaces used everywhere else.
  if(/^\t/m.test(source)) report(rel, 'is indented with tabs');

  // 5. Trailing whitespace makes diffs noisy for no benefit.
  const trailing = source.split('\n').findIndex(l => /\s+$/.test(l));
  if(trailing !== -1) report(rel, `has trailing whitespace on line ${trailing + 1}`);
}

// 6. The site scripts must stay free of Node and of noisy output. They run in
//    a browser, and a stray console.log ships to every visitor.
for(const file of jsFiles().filter(f => f.includes(`${path.sep}assets${path.sep}`))){
  const rel = path.relative(ROOT, file);
  const source = fs.readFileSync(file, 'utf8');

  if(/\brequire\s*\(|\bmodule\.exports\b|\bprocess\.env\b/.test(source)){
    report(rel, 'uses a Node API, but it runs in the browser');
  }
  if(/\bconsole\.(log|debug)\s*\(/.test(source)){
    report(rel, 'leaves a console.log in code that ships to visitors');
  }
}

// 7. index.html must load every asset it depends on, in an order where each
//    global exists before the file that reads it.
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const loaded = [...html.matchAll(/<script src="(assets\/[^"]+)"/g)].map(m => m[1]);

for(const file of fs.readdirSync(path.join(ROOT, 'assets')).filter(f => f.endsWith('.js'))){
  if(!loaded.includes(`assets/${file}`)){
    report('index.html', `never loads assets/${file}`);
  }
}
if(loaded.indexOf('assets/app.js') !== loaded.length - 1){
  report('index.html', 'app.js must be loaded last, after the data it reads');
}

// 8. Scripts must be local. The page promises that nothing a user types
//    leaves their machine, and a third-party script can read the DOM, so
//    every one would widen what a visitor has to trust. An earlier release
//    allowed one analytics beacon; it was removed because shared links carry
//    the form data in the URL fragment, where any script on the page can
//    read it. Keep this list empty unless that changes on purpose.
const ALLOWED_SCRIPT_HOSTS = new Set([]);

for(const [, url] of html.matchAll(/<script[^>]*src="(https?:[^"]+)"/g)){
  if(!ALLOWED_SCRIPT_HOSTS.has(new URL(url).host)){
    report('index.html', `loads a third-party script: ${url}`);
  }
}

if(problems.length){
  console.error(`\n${problems.length} problem(s):\n`);
  problems.forEach(p => console.error(`  ${p}`));
  console.error('');
  process.exit(1);
}

console.log('lint: clean');
