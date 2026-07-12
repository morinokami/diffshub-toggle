import { DEFAULT_SETTINGS } from "../lib/settings.js";

document.getElementById("open-shortcuts").addEventListener("click", () => {
  // chrome:// URLs cannot be linked from a page, but extensions may open
  // the shortcuts settings page via the tabs API.
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

const checkboxes = {
  openInNewTab: document.getElementById("open-in-new-tab"),
  returnToChanges: document.getElementById("return-to-changes"),
};

for (const [key, checkbox] of Object.entries(checkboxes)) {
  checkbox.addEventListener("change", () => {
    void chrome.storage.sync.set({ [key]: checkbox.checked });
  });
}

const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
for (const [key, checkbox] of Object.entries(checkboxes)) {
  checkbox.checked = settings[key];
}
