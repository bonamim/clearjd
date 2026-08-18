# Contributing

You do not need to write code to help. The most useful contributions are
usually a sentence about what a job post got wrong.

## The quickest way to help

[**Open an issue**](https://github.com/bonamim/clearjd/issues/new) and tell us:

- a field that is missing, or one that makes no sense in your country
- wording that reads badly, in any of the three languages
- a real job post that showed up a gap in the template

A concrete example beats an argument. If a post left you unable to decide
whether to apply, that is exactly the evidence this project runs on.

## Adding an example

Examples live in [`assets/examples.js`](./assets/examples.js) as data, and the
Markdown files in [`examples/`](./examples/) are generated from them.

1. Add an entry to `assets/examples.js`.
2. Run `npm run examples`.
3. Commit both the data and the generated file.

Pick a combination that is not covered yet: a different country, contract
type, or employment relationship. The set exists to prove the template works
beyond Portugal, not to collect variations of the same role.

Do not edit anything in `examples/` by hand. It is generated, and CI will
reject it.

## Adding a language

1. Copy the `en` block in [`assets/i18n.js`](./assets/i18n.js), rename it, and
   translate the values.
2. Add a button to the language toggle in `index.html`.

`npm test` fails if a language is missing a key, so a half-finished
translation cannot ship by accident.

## What gets accepted

The project exists to fight vague job posts, so the bar is:

- **Objective fields only.** If a field can be answered with a paragraph of
  atmosphere, it does not belong in the template.
- **A field must be answerable everywhere.** Contract types differ by country.
  If something only makes sense in one market, it belongs in that market's
  option list, not in the standard.
- **Adding a field has a cost.** Every field is one more thing to fill in
  before publishing. A field earns its place by changing whether someone
  applies.
- **Be objective in the pull request too.** This project is not the place to
  produce more vague text.

Please do not include real job posts containing company data you are not
authorised to share.

## Running the checks

Node 22 or newer. There are no dependencies to install.

```bash
npm test           # lint and the test suite
npm run lint       # the checks in tools/lint.js on their own
npm run examples   # regenerate examples/ from assets/examples.js
npm start          # serve at http://localhost:8000
npm run hooks      # optional: run the checks before each commit
```

`npm run hooks` is a convenience. CI runs the same checks on every pull
request and that is what blocks a merge, so skipping it costs you nothing but
a slower feedback loop.

## Versioning

Every generated job post is stamped with the template version it follows, so
a version has to mean one specific set of fields.

| Change | Bump | Effect on published posts |
|---|---|---|
| A field is removed or renamed, or its meaning changes | major | They stop being valid |
| A field or an option is added | minor | They stay valid |
| Wording, translations, examples, site changes | patch | No effect |

To release: set the same number in `assets/version.js` and `package.json`,
add the entry to [`CHANGELOG.md`](./CHANGELOG.md), merge, then tag `vX.Y.Z`.
The tests fail if those three disagree, so the version cannot drift.

## Who can merge

Anyone can open a pull request. Only maintainers can merge one.

Two things control that:

**Write access.** Nobody can merge without write access to the repository.
This is the control that actually matters, and it is the default: a
fork-and-pull-request contributor cannot merge their own work.

**Required review from code owners.**
[`.github/CODEOWNERS`](./.github/CODEOWNERS) lists who owns what. Ownership is
split: the catch-all line covers the site and the tooling, and the narrower
lines below cover the template, translations, version and changelog, the
things that change what a published post means.

That file does nothing on its own. It only takes effect once branch
protection is enabled on `main` with **Require review from Code Owners**.

**While the project has a single maintainer, do not turn required approvals
on.** GitHub does not let anyone approve their own pull request, so a lone
code owner plus "Require approvals" plus "Do not allow bypassing" locks that
person out of merging their own work permanently. Until there is a second
maintainer, protect `main` with **required status checks** and **no force
pushes** instead: CI still has to pass, and history is still safe, but you can
merge. Switch approvals on the day someone else can give them.

To add a maintainer: give them write access, then add their `@handle` to
`CODEOWNERS`. Add them to the narrower lines only once you would trust them
to redefine the standard. That is also the moment to enable required
approvals.
