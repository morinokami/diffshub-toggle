/**
 * Path patterns for pages that can be toggled between github.com and
 * diffshub.com: pull requests (and their changes/files/commits tabs),
 * commits, compares, and raw .diff/.patch views. Everything else (repo
 * roots, issues, user pages, ...) has no DiffsHub counterpart.
 *
 * The strings are unanchored and must stay compatible with both JS RegExp
 * and RE2: background.js embeds them into declarativeContent rules, so the
 * toolbar icon state and toggleUrl() can never disagree.
 */
export const TOGGLEABLE_PATH_PATTERNS = Object.freeze([
  "/[^/]+/[^/]+/pull/\\d+(/(changes|files|commits))?/?",
  "/[^/]+/[^/]+/pull/\\d+\\.(diff|patch)",
  "/[^/]+/[^/]+/commit/[^/]+/?",
  "/[^/]+/[^/]+/compare/.+",
]);

/**
 * Coarse Chrome match-pattern globs (path part only) covering every path in
 * TOGGLEABLE_PATH_PATTERNS, for APIs that take match patterns instead of
 * regexes — background.js builds the contextMenus targetUrlPatterns from
 * them.
 *
 * Match patterns cannot express the regexes exactly, so these are a strict
 * superset: every toggleable path matches a glob, but a few non-toggleable
 * paths (e.g. /org/repo/pull/123/checks) match too — callers must still
 * validate through toggleUrl(). Keep this list in sync when editing
 * TOGGLEABLE_PATH_PATTERNS; test/toggle-url.test.js enforces the superset.
 */
export const TOGGLEABLE_PATH_GLOBS = Object.freeze([
  "/*/*/pull/*",
  "/*/*/commit/*",
  "/*/*/compare/*",
]);

const TOGGLEABLE_PATHS = TOGGLEABLE_PATH_PATTERNS.map(
  (pattern) => new RegExp(`^${pattern}$`),
);

/** A pull request root path: /owner/repo/pull/123 (optional trailing slash). */
const PR_ROOT = /^\/[^/]+\/[^/]+\/pull\/\d+\/?$/;

/**
 * Toggle a URL between github.com and diffshub.com.
 *
 * Only the hostname is swapped; path, query, and hash are preserved.
 * The destination is always HTTPS. Paths without a DiffsHub counterpart
 * (see TOGGLEABLE_PATH_PATTERNS) are not toggled in either direction.
 *
 * @param {string} input - The current page URL.
 * @param {{ returnToChanges?: boolean }} [settings] - When returnToChanges
 *   is true and a DiffsHub pull request root URL toggles back to GitHub,
 *   the result lands on the Files changed tab (/changes) instead of the
 *   Conversation tab. DiffsHub itself redirects /changes to the PR root,
 *   so the other direction needs no rewriting.
 * @returns {string | null} The toggled URL, or null when the URL is not
 *   a toggleable GitHub/DiffsHub page (or cannot be parsed).
 */
export function toggleUrl(input, { returnToChanges = false } = {}) {
  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  if (!TOGGLEABLE_PATHS.some((pattern) => pattern.test(url.pathname))) {
    return null;
  }

  switch (url.hostname.toLowerCase()) {
    case "github.com":
    case "www.github.com":
      url.protocol = "https:";
      url.hostname = "diffshub.com";
      return url.toString();

    case "diffshub.com":
      url.protocol = "https:";
      url.hostname = "github.com";
      if (returnToChanges && PR_ROOT.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/?$/, "/changes");
      }
      return url.toString();

    default:
      return null;
  }
}
