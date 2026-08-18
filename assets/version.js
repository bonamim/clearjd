/* The version of the ClearJD standard.
 *
 * This is the version of the *template*, not of the website. It is stamped
 * into every generated job description so a post can be traced back to the
 * field set it was written against.
 *
 * Semantic versioning, applied to the template:
 *   MAJOR  a field is removed or renamed, or its meaning changes.
 *          Existing posts stop being valid against the new version.
 *   MINOR  a field is added, or an option is added to an existing field.
 *          Existing posts stay valid.
 *   PATCH  wording, translations, examples, or anything on the site.
 *
 * Keep this in step with package.json and CHANGELOG.md. A test enforces it.
 */
'use strict';

const CLEARJD_VERSION = '1.0.1';
