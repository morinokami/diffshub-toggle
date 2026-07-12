import { DEFAULT_SETTINGS } from "./lib/settings.js";
import { toggleUrl } from "./lib/toggle-url.js";

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

  const nextUrl = toggleUrl(tab.url);
  if (!nextUrl) {
    return;
  }

  const { openInNewTab } = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  try {
    if (openInNewTab) {
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

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-github-diffshub") {
    return;
  }
  void toggleTab(tab);
});

chrome.action.onClicked.addListener((tab) => {
  void toggleTab(tab);
});
