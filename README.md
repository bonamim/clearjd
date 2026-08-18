<div align="center">

<img src="assets/logo.png" alt="ClearJD" width="330">

### Job descriptions that lead with what actually decides whether someone applies.

[**→ Open the free generator**](https://bonamim.github.io/clearjd/)

English · Portuguese · Spanish&nbsp;&nbsp;·&nbsp;&nbsp;No account&nbsp;&nbsp;·&nbsp;&nbsp;Nothing is sent anywhere

</div>

---

## The problem

A candidate reads your job post and cannot answer six basic questions:

1. How many interview rounds is this, and is there a test?
2. When will I hear back, and when do I get a straight yes or no?
3. Is "remote" actually remote, or two days in the office?
4. Am I employed by you, or by an agency that will not name the client?
5. What does it pay?
6. What are the benefits, in a list, not in adjectives?

So they close the tab. Or worse, they apply, and you both find out at stage
three that the salary was never going to work. That is a wasted month for
them and a wasted pipeline for you.

Meanwhile the post spends three paragraphs on a "dynamic environment" and a
"passion for innovation".

## The fix

Answer those six questions first, in a fixed order, before anything about
the stack or the responsibilities. That is the whole idea.

There is nothing to install and nothing to learn:

**[Open the generator](https://bonamim.github.io/clearjd/)**, fill in the
fields, and copy the finished job description. It works in your browser, in
English, Portuguese or Spanish. There is no account, no signup, and nothing
you type ever leaves your computer.

Prefer to write it by hand? Copy [`TEMPLATE.md`](./TEMPLATE.md) instead.

## What a finished post looks like

> **Interview stages:** 3 stages. 1. HR screening (30min), 2. Technical, with a SQL and modelling exercise (60min), 3. Team fit with the data team (45min)
>
> **Technical assessment:** None
>
> **Feedback:** You hear back within 5 working days of each stage. Final decision within 10 working days of the last stage.
>
> **Work mode:** Hybrid. Minimum on site: 2 days per week
>
> **Contract type:** Permanent
>
> **Employment relationship:** Direct with the company
>
> **Salary range (gross):** 32000 to 42000 EUR per year
>
> **Benefits:** Health insurance, meal allowance on card, annual training budget of 500 EUR, flexible hours

Full examples, including a B2B contract through an agency and a freelance
role paid by the hour, are in [`examples/`](./examples/).

## Why bother

**It saves your time.** Candidates who would have dropped out at the salary
conversation drop out before you interview them. The ones who stay have
already accepted your terms.

**It is becoming the law.** The EU Pay Transparency Directive
([2023/970](https://eur-lex.europa.eu/eli/dir/2023/970/oj)) requires pay
information in job advertisements. Member states must apply it from
**June 2026**. Posts without a salary range are on the wrong side of that
date.

**It is what candidates say they want.** Every survey on the subject puts
salary and interview process at the top, and "company culture" paragraphs
near the bottom.

## Rules for filling it in

1. **Answer every field.** If something does not apply, write "N/A" and say
   why. Deleting a field makes it look like you are hiding the answer.
2. **Give a real range.** "Competitive" is not a range. Neither is a range so
   wide it means nothing.
3. **Be honest about hybrid.** If it is two days on site, say two days on
   site. People find out anyway, and they resent finding out late.
4. **Name the client, or say when you will.** If you are an agency and cannot
   name the end client yet, write "revealed at stage 2". That is a fair
   answer. Silence is not.
5. **Commit to a reply time.** Silence after an interview is the complaint
   candidates raise most. A number costs you nothing and is remembered.
6. **Cut the adjectives.** "Proactive team player" tells a candidate nothing.
   Describe what the person will actually do.

## Suggest a change

The template started with a Portuguese and Spanish context in mind, and the
goal is for it to work everywhere. If a field makes no sense in your market,
or one is missing, please say so.

- [Open an issue](https://github.com/bonamim/clearjd/issues/new) if something
  is missing, wrong, or badly worded. You do not need to write any code.
- [Add an example](./CONTRIBUTING.md) from your country or contract type.
- See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for how changes get reviewed and
  who approves them.

## Versions

The template is versioned, and every generated post is stamped with the
version it follows, so "ClearJD v1.0.0" always means one specific set of
fields. History and the rules for bumping are in
[`CHANGELOG.md`](./CHANGELOG.md).

---

<details>
<summary><strong>For developers</strong></summary>

### Running it locally

No build step, no dependencies. Node 22+ is only needed for the tests.

```bash
npm test           # lint and the test suite
npm start          # serve at http://localhost:8000
npm run examples   # regenerate examples/ from assets/examples.js
npm run hooks      # optional: run the checks before each commit
```

There is no linter to install. `tools/lint.js` uses only what Node ships with,
and the test suite covers the rules that matter here: translations complete,
examples in sync with their source, versions agreeing, every field wired
through to the export, every control labelled.

You can also just open `index.html` in a browser. The only thing that will
not work is the Copy button, because the clipboard API requires a secure
origin and `file://` is not one. Use `npm start` to test copying.

### Layout

```
index.html            markup only
assets/
  styles.css          design tokens, then layout, then components
  i18n.js             all translations, one object per language
  examples.js         the worked examples, as data
  version.js          the version of the standard
  app.js              the generator
examples/             generated from assets/examples.js, do not edit by hand
tools/                lint, test harness, example generator, dev server
tests/                run with `npm test`, no dependencies
```

The generator has one rule worth knowing: `collect()` in `assets/app.js` is
the single source of truth. The live preview and the Markdown export both
read from it, so what you see is always what you copy. A test enforces that.

### About `.nojekyll`

That empty file at the root is not junk, and deleting it will break the site.

GitHub Pages runs every repository through [Jekyll](https://jekyllrb.com)
before publishing it. Jekyll is a blog engine, and left to itself it would
treat this repository as a blog: it converts `README.md`, `TEMPLATE.md` and
the files in `examples/` into HTML pages of its own, and it silently ignores
any file or folder whose name starts with an underscore.

An empty `.nojekyll` file tells GitHub Pages to skip that step and serve the
files exactly as they are. It also makes the deploy faster. It has to sit at
the root of the published branch, and it has to stay empty.

### Adding a language

1. Copy the `en` block in `assets/i18n.js`, rename it, translate the values.
2. Add a button to the language toggle in `index.html`.

`npm test` fails if a language is missing a key, so nothing can half-ship.

</details>

---

MIT licensed. Use it, change it, publish it, no attribution required.

ClearJD is free and always will be. If it saved you time,
you can [buy me a coffee](https://buymeacoffee.com/bonamim).
