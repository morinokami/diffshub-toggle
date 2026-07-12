import { DEFAULT_SETTINGS } from "../lib/settings.js";

document.getElementById("open-shortcuts").addEventListener("click", () => {
  // chrome:// URLs cannot be linked from a page, but extensions may open
  // the shortcuts settings page via the tabs API.
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

const openInNewTab = document.getElementById("open-in-new-tab");

openInNewTab.addEventListener("change", () => {
  void chrome.storage.sync.set({ openInNewTab: openInNewTab.checked });
});

const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
openInNewTab.checked = settings.openInNewTab;
