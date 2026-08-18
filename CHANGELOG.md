# Changelog

All notable changes to the ClearJD standard are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Versions describe the **template**, not the website. Every generated job
description is stamped with the version it was written against.

| Change | Bump | Effect on existing posts |
|---|---|---|
| A field is removed or renamed, or its meaning changes | **major** | They stop being valid |
| A field or an option is added | **minor** | They stay valid |
| Wording, translations, examples, site changes | **patch** | No effect |

## [1.0.0]

The first published version of the standard.

### Added

- **Essentials** section, answered before anything about the stack:
  number of interview stages, technical assessment and how long it takes,
  work mode with minimum time on site, required timezone overlap,
  contract type, employment relationship, salary range, benefits.
- **Tech stack** split into what is required and what is nice to have,
  so a wish list cannot pass as a requirement.
- **What we expect from you**, written as concrete responsibilities.
- A browser-based generator in English, Portuguese and Spanish that produces
  the Markdown for you. It has no backend and stores nothing.
- Three worked examples covering different markets, contract types and
  employment relationships.

### Notes

- The salary range field exists because the EU Pay Transparency Directive
  (2023/970) gives applicants the right to the starting pay or its range
  before the interview, with a transposition deadline of 7 June 2026, and
  because it is the single most common reason candidates skip a post.
- Every field is expected to be answered. A field that does not apply should
  say so explicitly rather than be deleted, so a gap never reads as an
  accidental omission.

[1.0.0]: https://github.com/bonamim/clearjd/releases/tag/v1.0.0
