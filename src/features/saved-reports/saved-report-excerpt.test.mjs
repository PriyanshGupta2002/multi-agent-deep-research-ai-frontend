import assert from "node:assert/strict";
import test from "node:test";
import { getSavedReportExcerpt } from "./saved-report-excerpt.ts";

test("removes standalone Markdown heading markers", () => {
  assert.equal(getSavedReportExcerpt("## Executive Summary"), "Executive Summary");
});

test("removes heading markers embedded in a paragraph", () => {
  assert.equal(
    getSavedReportExcerpt(
      "Evidence ## Executive Summary Current findings...",
    ),
    "Evidence Executive Summary Current findings...",
  );
});

test("preserves emphasized text while removing its markers", () => {
  assert.equal(getSavedReportExcerpt("**Important finding**"), "Important finding");
});

test("preserves Markdown link labels without URLs", () => {
  assert.equal(
    getSavedReportExcerpt("[Read more](https://example.com)"),
    "Read more",
  );
});

test("keeps ordinary hashtags", () => {
  assert.equal(getSavedReportExcerpt("Research on #AI systems"), "Research on #AI systems");
});

test("cleans emphasis, inline code, list markers, and horizontal rules", () => {
  assert.equal(
    getSavedReportExcerpt(
      "Summary\n\n- **Key** finding\n\n---\n\nUse `code` and _emphasis_.",
    ),
    "Summary Key finding Use code and emphasis.",
  );
});
