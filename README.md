# DiffsHub Toggle

A Chrome extension (Manifest V3) that toggles the current tab between matching
[GitHub](https://github.com/) and [DiffsHub](https://diffshub.com/) pages with a
single keyboard shortcut.

```text
https://github.com/org/repo/pull/123
        ⇅  Alt+Shift+D
https://diffshub.com/org/repo/pull/123
```

Only the hostname is swapped — path, query parameters, and hash are preserved
(optionally, returning to a GitHub pull request can land on its **Files
changed** tab, `/changes`).
The extension reads nothing from the page, requires only the `activeTab`,
`declarativeContent`, and `storage` permissions, and collects no data.

## Install (unpacked)

1. Open `chrome://extensions/` and enable **Developer mode**.
2. Click **Load unpacked** and select the `extension/` directory.

## Usage

- Press **Alt+Shift+D** (**Option+Shift+D** on macOS) on a GitHub or DiffsHub
  page to jump to the matching page. Press it again to come back.
- Clicking the toolbar icon does the same thing.
- By default the current tab navigates in place. To open the matching page in
  a new tab instead, enable **Open the matching page in a new tab** on the
  extension's options page.
- Returning from DiffsHub to a GitHub pull request lands on the Conversation
  tab. To land on the **Files changed** tab (`/changes`) instead, enable the
  corresponding option on the options page.
- The toolbar icon is active only on pages with a DiffsHub counterpart:
  pull requests (including their `/changes`, `/files`, and `/commits` tabs),
  commits, compares, and raw `.diff`/`.patch` views. Everywhere else — other
  GitHub or DiffsHub pages, other sites, Chrome internal pages — the icon is
  grayed out and the shortcut does nothing.
- Change the shortcut anytime at `chrome://extensions/shortcuts`.

Note: DiffsHub currently supports public GitHub diffs. For private
repositories, the toggled page may not render — press the shortcut again to
return to GitHub.

## Privacy

This extension does not collect user data or send it to the developer. Your
settings are stored with Chrome's extension storage and may be synced between
your devices by Chrome when browser sync is enabled. The toolbar icon's
active/grayed state is driven by Chrome's `declarativeContent` API, which
matches URLs inside the browser without exposing them to the extension. The
extension does not monitor your browsing; only when you explicitly invoke it
does it read the active tab's URL to replace the hostname between `github.com`
and `diffshub.com`.
