import assert from "node:assert/strict";
import { test } from "node:test";

import { toggleUrl } from "../extension/lib/toggle-url.js";

test("GitHub PR URL -> DiffsHub", () => {
  assert.equal(
    toggleUrl("https://github.com/withastro/astro/pull/123"),
    "https://diffshub.com/withastro/astro/pull/123",
  );
});

test("DiffsHub PR URL -> GitHub", () => {
  assert.equal(
    toggleUrl("https://diffshub.com/withastro/astro/pull/123"),
    "https://github.com/withastro/astro/pull/123",
  );
});

test("GitHub commit URL -> DiffsHub", () => {
  assert.equal(
    toggleUrl("https://github.com/org/repo/commit/abcdef"),
    "https://diffshub.com/org/repo/commit/abcdef",
  );
});

test("GitHub compare URL -> DiffsHub", () => {
  assert.equal(
    toggleUrl("https://github.com/org/repo/compare/main...feature"),
    "https://diffshub.com/org/repo/compare/main...feature",
  );
});

test(".diff URL keeps its extension", () => {
  assert.equal(
    toggleUrl("https://github.com/org/repo/pull/123.diff"),
    "https://diffshub.com/org/repo/pull/123.diff",
  );
});

test(".patch URL keeps its extension", () => {
  assert.equal(
    toggleUrl("https://github.com/org/repo/pull/123.patch"),
    "https://diffshub.com/org/repo/pull/123.patch",
  );
});

test("query parameters are preserved", () => {
  assert.equal(
    toggleUrl("https://github.com/org/repo/pull/123?diff=split&w=1"),
    "https://diffshub.com/org/repo/pull/123?diff=split&w=1",
  );
});

test("hash is preserved", () => {
  assert.equal(
    toggleUrl(
      "https://github.com/org/repo/pull/123?diff=split#discussion_r123",
    ),
    "https://diffshub.com/org/repo/pull/123?diff=split#discussion_r123",
  );
});

test("www.github.com is normalized to diffshub.com", () => {
  assert.equal(
    toggleUrl("https://www.github.com/org/repo/pull/123"),
    "https://diffshub.com/org/repo/pull/123",
  );
});

test("hostname matching is case-insensitive", () => {
  assert.equal(
    toggleUrl("https://GitHub.com/org/repo"),
    "https://diffshub.com/org/repo",
  );
});

test("http is upgraded to https", () => {
  assert.equal(
    toggleUrl("http://github.com/org/repo/pull/123"),
    "https://diffshub.com/org/repo/pull/123",
  );
});

test("other sites return null", () => {
  assert.equal(toggleUrl("https://example.com/org/repo/pull/123"), null);
  assert.equal(toggleUrl("https://gist.github.com/user/abc"), null);
  assert.equal(toggleUrl("https://github.com.evil.example/org/repo"), null);
});

test("non-http(s) schemes return null", () => {
  assert.equal(toggleUrl("chrome://extensions/"), null);
  assert.equal(toggleUrl("ftp://github.com/org/repo"), null);
});

test("invalid URLs return null", () => {
  assert.equal(toggleUrl("not a url"), null);
  assert.equal(toggleUrl(""), null);
});

test("returnToChanges: DiffsHub PR root -> GitHub Files changed tab", () => {
  assert.equal(
    toggleUrl("https://diffshub.com/org/repo/pull/123", {
      returnToChanges: true,
    }),
    "https://github.com/org/repo/pull/123/changes",
  );
});

test("returnToChanges: trailing slash is handled", () => {
  assert.equal(
    toggleUrl("https://diffshub.com/org/repo/pull/123/", {
      returnToChanges: true,
    }),
    "https://github.com/org/repo/pull/123/changes",
  );
});

test("returnToChanges: query and hash come after /changes", () => {
  assert.equal(
    toggleUrl("https://diffshub.com/org/repo/pull/123?w=1#top", {
      returnToChanges: true,
    }),
    "https://github.com/org/repo/pull/123/changes?w=1#top",
  );
});

test("returnToChanges: non-PR-root DiffsHub URLs are untouched", () => {
  assert.equal(
    toggleUrl("https://diffshub.com/org/repo/commit/abcdef", {
      returnToChanges: true,
    }),
    "https://github.com/org/repo/commit/abcdef",
  );
  assert.equal(
    toggleUrl("https://diffshub.com/org/repo/pull/123/commits", {
      returnToChanges: true,
    }),
    "https://github.com/org/repo/pull/123/commits",
  );
  assert.equal(
    toggleUrl("https://diffshub.com/org/repo/pull/123.diff", {
      returnToChanges: true,
    }),
    "https://github.com/org/repo/pull/123.diff",
  );
});

test("returnToChanges: GitHub -> DiffsHub direction is unaffected", () => {
  assert.equal(
    toggleUrl("https://github.com/org/repo/pull/123/changes", {
      returnToChanges: true,
    }),
    "https://diffshub.com/org/repo/pull/123/changes",
  );
});
