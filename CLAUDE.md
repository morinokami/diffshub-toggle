# DiffsHub Toggle

Chrome extension (Manifest V3, vanilla ESM JavaScript) that toggles the active
tab between matching github.com and diffshub.com URLs. There is no
build/bundle step — files in `extension/` run as-is in Chrome.

# Commands

The package manager is **nub**, not npm/pnpm (see `devEngines`, `nub.lock`).
Run scripts with `nub run <script>`:

- `nub run test` — `node --test` over `test/*.test.js`
- `nub run lint` / `nub run lint:fix` — oxlint
- `nub run fmt` / `nub run fmt:check` — oxfmt, 80-column width
- `nub run build` — zips `extension/` into `diffshub-toggle-<version>.zip`
  for the Chrome Web Store

# Constraints

- Everything under `extension/` ships verbatim in the store ZIP — never put
  dev-only files, tests, or docs there.
- Modules under `extension/lib/` (`toggle-url.js`, `settings.js`) are
  imported by both the extension and the Node tests. Keep them pure: no
  `chrome.*` APIs, no browser-only globals.
- The extension must stay at the `activeTab` + `storage` permissions and
  must never collect or transmit data — the README's privacy statement
  depends on this. Don't add further permissions, host access, or content
  scripts without being asked.
- User settings live in `chrome.storage.sync`. Defaults for every setting
  go in `extension/lib/settings.js` (`DEFAULT_SETTINGS`); read them with
  `chrome.storage.sync.get(DEFAULT_SETTINGS)` so missing keys fall back
  automatically — no onInstalled initialization or migrations.

# Workflow

- After code changes, run `nub run test`, `nub run lint`, and
  `nub run fmt:check`.
- Version bumps: update `extension/manifest.json` **and** `package.json`
  (build.sh reads the version from manifest.json).
