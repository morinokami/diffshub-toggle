/**
 * Toggle a URL between github.com and diffshub.com.
 *
 * Only the hostname is swapped; path, query, and hash are preserved.
 * The destination is always HTTPS.
 *
 * @param {string} input - The current page URL.
 * @returns {string | null} The toggled URL, or null when the URL is not
 *   a GitHub/DiffsHub page (or cannot be parsed).
 */
export function toggleUrl(input) {
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
      return url.toString();

    default:
      return null;
  }
}
