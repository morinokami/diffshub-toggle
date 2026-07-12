/**
 * Default values for every user-configurable setting.
 *
 * Pass this object to chrome.storage.sync.get() so keys the user has never
 * saved come back with their defaults — no install-time initialization or
 * migration step is needed.
 */
export const DEFAULT_SETTINGS = Object.freeze({
  openInNewTab: false,
  returnToChanges: false,
});
