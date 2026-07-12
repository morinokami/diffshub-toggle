import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_SETTINGS } from "../extension/lib/settings.js";

test("every setting has a default", () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    openInNewTab: false,
    returnToChanges: false,
  });
});

test("defaults are frozen against accidental mutation", () => {
  assert.ok(Object.isFrozen(DEFAULT_SETTINGS));
});
