/* Test harness.
 *
 * The generator is plain browser JavaScript with no build step, so tests load
 * it into a minimal DOM stub instead of pulling in a headless browser. The
 * stub implements only what app.js actually touches.
 *
 * app.js itself has no test-only exports: the harness appends an expression
 * to the evaluated source to reach its internals.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

/** A DOM element stub. Records what the app writes to it. */
function makeElement(id){
  return {
    id,
    value:'', innerHTML:'', textContent:'', placeholder:'',
    hidden:false, dataset:{}, attributes:{},
    classList:{ add(){}, remove(){} },
    setAttribute(name, v){ this.attributes[name] = v; },
    getAttribute(name){ return this.attributes[name]; },
    querySelectorAll(){ return []; },
    addEventListener(){},
    remove(){}, click(){},
  };
}

/**
 * Load index.html + i18n.js + app.js into a fresh stubbed DOM.
 * Returns the app internals plus the element map, so tests can set input
 * values and read back what the generator produced.
 */
function loadApp(){
  const html = read('index.html');

  const els = {};
  for(const m of html.matchAll(/id="([a-zA-Z_]+)"/g)){
    els[m[1]] = makeElement(m[1]);
  }

  const sandbox = {
    document:{
      documentElement:{},
      getElementById: id => els[id],
      querySelectorAll: () => [],
      createElement: () => makeElement('created'),
      body:{ appendChild(){} },
    },
    window:{ alert(){} },
    navigator:{ clipboard:{ writeText: async () => {} } },
    Blob: class {},
    URL:{ createObjectURL: () => '', revokeObjectURL(){} },
    setTimeout, clearTimeout,
  };

  // Run both scripts in one scope, the way the browser does with plain
  // <script> tags, then hand back the internals the tests need.
  const source = `
    ${read('assets/version.js')}
    ${read('assets/i18n.js')}
    ${read('assets/examples.js')}
    ${read('assets/app.js')}
    ({ I18N, CURRENCIES, EXAMPLES, CLEARJD_VERSION, FIELD_IDS, MAX_STAGES,
       collect, toMarkdown, filename, render, state, loadExample,
       setStageCount, renderStageInputs,
       getStages: () => stages,
       setLang: l => { lang = l; applyStaticI18n(); } })
  `;
  const run = new Function(...Object.keys(sandbox), `'use strict'; return eval(${JSON.stringify(source)});`);
  const api = run(...Object.values(sandbox));

  return { ...api, els, html };
}

/** Fill the form with a realistic, fully populated job post. */
function fillExample(app){
  const els = app.els;
  const set = (id, value) => { els[id].value = value; };

  app.setStageCount(3);
  const stages = app.getStages();
  stages[0].what = 'HR screening';        stages[0].minutes = '30';
  stages[1].what = 'Technical';           stages[1].minutes = '60';
  stages[2].what = 'Team fit';            stages[2].minutes = '45';

  set('f_title',         'Data Engineer (Snowflake)');
  set('f_stages_count',  '3');
  set('f_feedback_days', '5');
  set('f_decision_days', '10');
  set('f_test_time',     '4');
  set('f_days',         '2');
  set('f_tz',           'At least 4h overlap with UTC');
  set('f_contract',     'permanent');   // a <select> value, not its label
  set('f_client',       'Acme Corp');
  set('f_min',          '32000');
  set('f_max',          '42000');
  set('f_currency',     'EUR');
  set('f_benefits',     'Health insurance, meal allowance');
  set('f_required',     'SQL, Snowflake, dbt');
  set('f_nice',         'Python, Airflow');
  set('f_expect',       'Design reliable pipelines\nDocument what you build');
}

/**
 * Load one example into a loaded app and return the Markdown it produces.
 * Used both by `npm run examples` to write the files and by the tests to
 * check the committed files still match.
 */
function renderExample(app, id){
  app.loadExample(id);
  return app.toMarkdown();
}

module.exports = { loadApp, fillExample, renderExample, read, ROOT };
