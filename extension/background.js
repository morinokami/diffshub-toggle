import { DEFAULT_SETTINGS } from "./lib/settings.js";
import { TOGGLEABLE_PATH_PATTERNS, toggleUrl } from "./lib/toggle-url.js";

/**
 * Send the given tab to its GitHub/DiffsHub counterpart — in place, or in
 * a new tab next to it when the openInNewTab setting is enabled.
 *
 * Silently does nothing when the tab has no toggleable URL
 * (non-target sites, chrome:// pages, etc.).
 *
 * @param {chrome.tabs.Tab | undefined} tab
 */
async function toggleTab(tab) {
  if (!tab?.id || !tab.url) {
    return;
  }

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  const nextUrl = toggleUrl(tab.url, settings);
  if (!nextUrl) {
    return;
  }

  try {
    if (settings.openInNewTab) {
      await chrome.tabs.create({
        url: nextUrl,
        index: tab.index + 1,
        openerTabId: tab.id,
      });
    } else {
      await chrome.tabs.update(tab.id, { url: nextUrl });
    }
  } catch (error) {
    // The tab may have been closed while handling the command.
    console.debug("GitHub <-> DiffsHub toggle failed:", error);
  }
}

/**
 * Load a packaged icon as ImageData for a declarativeContent SetIcon
 * action, which does not accept paths in MV3 (crbug.com/893087).
 *
 * @param {number} size
 */
async function loadIconImageData(size) {
  const response = await fetch(chrome.runtime.getURL(`icons/icon-${size}.png`));
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, size, size);
  return context.getImageData(0, 0, size, size);
}

// The action's default icon (manifest.json) is the grayed-out variant, so
// the extension looks inactive by default; declarativeContent swaps in the
// colored icon on toggleable pages. The URL matching happens inside the
// browser, so the extension never reads the URLs of pages the user visits.
// The action itself stays enabled everywhere (MV3 has no reliable global
// chrome.action.disable(), so ShowAction-based graying does not work);
// clicks and shortcuts on non-toggleable pages are no-ops because
// toggleUrl() returns null.
chrome.runtime.onInstalled.addListener(async () => {
  // Undo any disabled default left behind by earlier dev builds; the
  // icon, not the enabled state, signals toggleability.
  chrome.action.enable();

  const imageData = {
    16: await loadIconImageData(16),
    32: await loadIconImageData(32),
  };
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: TOGGLEABLE_PATH_PATTERNS.map(
          (pattern) =>
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: {
                originAndPathMatches: `^https?://((www\\.)?github\\.com|diffshub\\.com)${pattern}$`,
              },
            }),
        ),
        actions: [new chrome.declarativeContent.SetIcon({ imageData })],
      },
    ]);
  });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-github-diffshub") {
    return;
  }
  void toggleTab(tab);
});

chrome.action.onClicked.addListener((tab) => {
  void toggleTab(tab);
});
