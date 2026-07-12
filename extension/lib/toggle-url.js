/** A pull request root path: /owner/repo/pull/123 (optional trailing slash). */
const PR_ROOT = /^\/[^/]+\/[^/]+\/pull\/\d+\/?$/;

/**
 * Toggle a URL between github.com and diffshub.com.
 *
 * Only the hostname is swapped; path, query, and hash are preserved.
 * The destination is always HTTPS.
 *
 * @param {string} input - The current page URL.
 * @param {{ returnToChanges?: boolean }} [settings] - When returnToChanges
 *   is true and a DiffsHub pull request root URL toggles back to GitHub,
 *   the result lands on the Files changed tab (/changes) instead of the
 *   Conversation tab. DiffsHub itself redirects /changes to the PR root,
 *   so the other direction needs no rewriting.
 * @returns {string | null} The toggled URL, or null when the URL is not
 *   a GitHub/DiffsHub page (or cannot be parsed).
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
