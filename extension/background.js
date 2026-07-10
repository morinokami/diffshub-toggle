import { toggleUrl } from "./lib/toggle-url.js";

/**
 * Navigate the given tab to its GitHub/DiffsHub counterpart.
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

  try {
    await chrome.tabs.update(tab.id, { url: nextUrl });
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
