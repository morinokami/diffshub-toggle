import { DEFAULT_SETTINGS } from "./lib/settings.js";
import {
  TOGGLEABLE_PATH_GLOBS,
  TOGGLEABLE_PATH_PATTERNS,
  toggleUrl,
} from "./lib/toggle-url.js";

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

// Context menu item for links pointing at toggleable github.com pages.
// GitHub -> DiffsHub only: DiffsHub links barely occur in the wild, so the
// reverse item earned no menu space. TOGGLEABLE_PATH_GLOBS approximates
// TOGGLEABLE_PATH_PATTERNS as match patterns (regexes are not supported), so
// a few near-miss links without a counterpart — e.g. a PR's /checks tab —
// still show the item; clicking those is a no-op via toggleUrl(), the same
// behavior as action clicks on non-toggleable pages. Chrome matches
// targetUrlPatterns inside the browser — the extension only receives a link's
// URL when the user picks the item.
const OPEN_LINK_MENU_ITEM = Object.freeze({
  id: "open-link-in-diffshub",
  title: "Open Link in DiffsHub",
  targetUrlPatterns: ["github.com", "www.github.com"].flatMap((host) =>
    TOGGLEABLE_PATH_GLOBS.map((glob) => `*://${host}${glob}`),
  ),
});

/**
 * Open the DiffsHub counterpart of a right-clicked GitHub link.
 *
 * Always opens a new tab regardless of the openInNewTab setting: a link
 * context menu item should never navigate the current page away. No other
 * setting applies either — the menu only matches GitHub links, and
 * returnToChanges only affects the DiffsHub -> GitHub direction.
 *
 * Silently does nothing when the link has no toggleable URL.
 *
 * @param {chrome.contextMenus.OnClickData} info
 * @param {chrome.tabs.Tab | undefined} tab
 */
async function openLinkCounterpart(info, tab) {
  if (!info.linkUrl) {
    return;
  }

  const nextUrl = toggleUrl(info.linkUrl);
  if (!nextUrl) {
    return;
  }

  try {
    await chrome.tabs.create({
      url: nextUrl,
      ...(tab?.id ? { index: tab.index + 1, openerTabId: tab.id } : {}),
    });
  } catch (error) {
    // The originating tab may have been closed while handling the click.
    console.debug("GitHub <-> DiffsHub link open failed:", error);
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
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ ...OPEN_LINK_MENU_ITEM, contexts: ["link"] });
  });

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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== OPEN_LINK_MENU_ITEM.id) {
    return;
  }
  void openLinkCounterpart(info, tab);
});
