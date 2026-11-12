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

## [1.1.0]

The other side of the screening. Recruiters can now ask candidates for a
**candidate card**: the answers to the questions every screening call
repeats, filled in once and sent as a link or as Markdown. A post written
against 1.0.x is still a valid post.

### Added

- The candidate card, on the same page as the generator, behind a switch at
  the top, and at `#card` for a link a recruiter can send to candidates.
  Its fields mirror the job description's and use the same option values:
  - Location and timezone.
  - Work modes accepted, any of remote, hybrid and on-site, with the most
    time on site the candidate would accept if hybrid is on the list.
  - Contract types accepted, from the job description's own list, plus a
    free note for anything the list does not say.
  - Whether hiring through a staffing agency is accepted.
  - Notice period, in weeks or months; zero reads "Available immediately".
  - Expected salary (gross), with currency and period. A floor on its own
    reads "From 45000 EUR per year".
  - Relocation, yes, no or depends, with the conditions.
  - Experience by technology, as rows of one technology and its years, most
    experience first. Years are kept between 0 and 50 in half-year steps,
    duplicates and rows holding a list are flagged.
- [`CARD.md`](./CARD.md), the card to fill in by hand, and two worked cards
  in `examples/`.
- Share links for both documents. The whole form travels in the URL
  fragment (`#card=…`, `#jd=…`), which browsers never send to a server.
  Links carry option keys, not labels, so a recruiter can read a card in
  their own language. Everything read from a link is checked against the
  form's own fields and options before it is used.

### Removed

- Cloudflare Web Analytics. Share links put the form in the address, where
  any script on the page could read it, so the site goes back to loading no
  third-party scripts. The footer no longer mentions visit counts.

### Fixed

- The number next to a unit toggle (minimum days on site, assessment time)
  stretched across the whole column and pushed the unit onto its own line.

### Notes

- The generator was split into a shared engine (`assets/core.js`) and one
  file per document (`assets/jd.js`, `assets/card.js`), so both use the same
  toggles, row lists, salary formatting and export code. The job description
  output is unchanged byte for byte.
- Comparing a job description with a card field by field is planned, not
  part of this release.

## [1.0.1]

A site release. The template is untouched, so a post written against 1.0.0
is still a valid post.

### Added

- Anonymous visit counting, through Cloudflare Web Analytics. It sets no
  cookies, stores no IP addresses and does not track anyone between sites.

### Changed

- The privacy line now says your answers never leave your browser, in all
  three languages, rather than that nothing is sent anywhere. The generator
  still has no backend and still sends nothing you type; the old wording
  stopped being literally true the moment a visit counter existed, and a
  promise that is nearly true is worse than a narrower one that holds.

### Notes

- The beacon reports the page address, the referrer and load timings. It
  never sees the form, because the form is never submitted anywhere.
- `tools/lint.js` refused the change on sight: it banned third-party scripts
  outright. That rule is now a one-host allowlist rather than a ban, so
  adding a second script is still a decision someone has to make on purpose.

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

[1.0.1]: https://github.com/bonamim/clearjd/releases/tag/v1.0.1
[1.0.0]: https://github.com/bonamim/clearjd/releases/tag/v1.0.0
