/* Share links: the form travels in the URL fragment and comes back intact.
 * Anything read from a link is untrusted, so these also check what a broken
 * or hostile link can and cannot do.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, fillExample, fillCard } = require('../tools/harness');

const hashOf = link => link.slice(link.indexOf('#'));

/** Build a link the way the page would, then open it in a fresh page. */
function roundTrip(prepare, docId){
  const sender = loadApp();
  prepare(sender);
  const link = sender.shareLink(sender.DOCS[docId]);
  const receiver = loadApp({ hash:hashOf(link) });
  return { sender, receiver, link };
}

/** A link carrying any object, as an attacker could craft one. */
const craft = (app, docId, data) => `#${docId}=${app.encodeShare(data)}`;


test('encoding survives any text, accents and emoji included', () => {
  const { encodeShare, decodeShare } = loadApp();
  const data = { text:'Engenheira de Dados Sénior, São Paulo 🚀', n:[1, 2] };

  const encoded = encodeShare(data);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/, 'the link must only use URL-safe characters');
  assert.deepEqual(decodeShare(encoded), data);
});

test('a shared card opens exactly as it was sent', () => {
  const { sender, receiver, link } = roundTrip(fillCard, 'card');

  assert.match(link, /^https:\/\/bonamim\.github\.io\/clearjd\/#card=/);
  assert.equal(receiver.getMode(), 'card');
  assert.equal(receiver.cardToMarkdown(), sender.cardToMarkdown());
  assert.equal(receiver.els.shareNotice.hidden, false);
  assert.match(receiver.els.shareNotice.textContent, /shared link/);
});

test('a shared job description opens exactly as it was sent, stages included', () => {
  const { sender, receiver } = roundTrip(app => { fillExample(app); app.state.mode = 'hybrid'; }, 'jd');

  assert.equal(receiver.getMode(), 'jd');
  assert.equal(receiver.toMarkdown(), sender.toMarkdown());
  assert.match(receiver.toMarkdown(), /3 stages\. 1\. HR screening \(30min\)/);
});

test('a link opens in the language it was written in, and can be read in another', () => {
  const { sender, receiver } = roundTrip(app => { fillCard(app); app.setLang('pt'); }, 'card');

  assert.equal(receiver.getLang(), 'pt');
  assert.equal(receiver.cardToMarkdown(), sender.cardToMarkdown());

  // The link holds option keys, not labels, so the recruiter's language wins
  // for everything except what the candidate typed.
  receiver.setLang('en');
  const md = receiver.cardToMarkdown();
  assert.match(md, /\*\*Notice period:\*\* 1 month/);
  assert.match(md, /Permanent, Freelance\. Self-employed, willing to set up a company/);
});

test('links carry option keys, never translated labels', () => {
  const app = loadApp();
  fillCard(app);
  app.setLang('pt');
  const data = app.decodeShare(hashOf(app.shareLink(app.DOCS.card)).slice('#card='.length));

  assert.deepEqual(data.state.cardContracts, ['permanent', 'freelance']);
  assert.equal(data.doc, 'card');
  assert.equal(data.v, app.CLEARJD_VERSION);
  assert.ok(!JSON.stringify(data).includes('Sem termo'));
});

test('#card on its own opens an empty card, the link a recruiter sends', () => {
  const app = loadApp({ hash:'#card' });
  assert.equal(app.getMode(), 'card');
  assert.equal(app.els.shareNotice.hidden, true);
  assert.equal(app.els.form_card.hidden, false);
  assert.equal(app.els.form_jd.hidden, true);
});

test('switching document updates the address, so #card can be copied', () => {
  const app = loadApp();
  app.switchMode('card');
  assert.equal(app.location.hash, '#card');
  app.switchMode('jd');
  assert.equal(app.location.hash, '');
});

test('a broken or cut-off link says so instead of failing', () => {
  const good = loadApp();
  fillCard(good);
  const hash = hashOf(good.shareLink(good.DOCS.card));

  for(const bad of ['#card=', '#card=!!!', '#card=abc', hash.slice(0, hash.length - 12), '#card=' + 'A'.repeat(30000)]){
    const app = loadApp({ hash:bad });
    assert.equal(app.getMode(), 'card');
    assert.equal(app.els.shareNotice.textContent, app.I18N.en.share_invalid, `no warning for "${bad.slice(0, 30)}"`);
    assert.match(app.cardToMarkdown(), /\[Candidate card\]/, 'a broken link must not half-fill the form');
  }
});

test('a link for one document cannot fill the other', () => {
  const app = loadApp();
  fillCard(app);
  const cardData = hashOf(app.shareLink(app.DOCS.card)).slice('#card='.length);

  const opened = loadApp({ hash:`#jd=${cardData}` });
  assert.equal(opened.els.shareNotice.textContent, opened.I18N.en.share_invalid);
});

test('a hostile link only reaches the fields the form has, as plain text', () => {
  const probe = loadApp();
  const hash = craft(probe, 'card', {
    v:'1.1.0', doc:'card', lang:'xx',
    fields:{
      c_name:'<img src=x onerror=alert(1)>',
      c_location:'x'.repeat(5000),
      c_currency:'<b>',
      c_notice:{ toString(){ return 'nope'; } },
      f_title:'from the other document',
    },
    state:{
      cardModes:['remote', 'teleport', 'remote'],
      cardContracts:'b2b',
      cardAgency:'maybe',
      cardPeriod:'year',
      evil:'yes',
    },
    rows: Array.from({ length:100 }, (_, i) => ({ name:`T${i}`, years:'1', extra:'<script>' })),
  });

  const app = loadApp({ hash });
  const f = app.collectCard();

  // A key named __proto__ only survives JSON, so build that link from JSON.
  const proto = loadApp({ hash:`#card=${probe.encodeShare(JSON.parse(
    '{"doc":"card","fields":{"__proto__":{"polluted":true}},"state":{"__proto__":{"polluted":true}},"rows":[{"__proto__":{"polluted":true}}]}'
  ))}` });
  assert.equal(({}).polluted, undefined, 'a link must not reach Object.prototype');
  assert.equal(proto.state.polluted, undefined);
  assert.equal(proto.techList.rows[0]?.polluted, undefined);

  assert.equal(app.getLang(), 'en', 'an unknown language falls back');
  assert.equal(app.els.c_location.value.length, 2000, 'text is capped');
  assert.equal(app.els.c_currency.value, 'EUR', 'a select only takes values it offers');
  assert.equal(app.els.c_notice.value, '', 'objects are not text');
  assert.equal(app.els.f_title.value, '', 'a card link cannot write into the job description');
  assert.deepEqual(app.state.cardModes, ['remote'], 'unknown and repeated options are dropped');
  assert.deepEqual(app.state.cardContracts, [], 'a multi-select only takes a list');
  assert.equal(app.state.cardAgency, '', 'an unknown option falls back to unanswered');
  assert.ok(!('evil' in app.state));
  assert.equal(app.techList.rows.length, app.MAX_TECHS, 'rows are capped');
  assert.ok(!('extra' in app.techList.rows[0]), 'rows only keep known cells');

  app.render();
  assert.ok(!app.els.doc.innerHTML.includes('<img'), 'link content must be escaped in the preview');
  assert.ok(f.title.includes('<img'), 'and kept as typed in the text itself');
});

test('a link from a future major version is opened with a warning', () => {
  const probe = loadApp();
  const hash = craft(probe, 'card', { v:'9.0.0', doc:'card', fields:{ c_name:'Ana' }, state:{}, rows:[] });
  const app = loadApp({ hash });

  assert.equal(app.els.c_name.value, 'Ana');
  assert.match(app.els.shareNotice.textContent, /v9\.0\.0/);
});

test('opening a link replaces what was in the form', () => {
  const sender = loadApp();
  fillCard(sender);
  sender.els.c_relocate_cond.value = '';
  sender.state.cardRelocate = 'no';
  const link = sender.shareLink(sender.DOCS.card);

  const app = loadApp();
  app.loadExample('candidate-data-engineer-portugal');
  app.location.hash = hashOf(link);
  app.openFromAddress();

  assert.equal(app.cardToMarkdown(), sender.cardToMarkdown());
});
