document.getElementById("open-shortcuts").addEventListener("click", () => {
  // chrome:// URLs cannot be linked from a page, but extensions may open
  // the shortcuts settings page via the tabs API.
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
