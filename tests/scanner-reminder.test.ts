import assert from "node:assert/strict";
import test from "node:test";
import { scheduleYellowReview, yellowReviewIsDue } from "../lib/scanner/reminder";

test("monthly review becomes due 30 days after a scan", () => {
  const values = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  } });
  try {
    const scannedAt = Date.UTC(2026, 10, 16);
    scheduleYellowReview(scannedAt);
    assert.equal(yellowReviewIsDue(scannedAt), false);
    assert.equal(yellowReviewIsDue(scannedAt + 29 * 24 * 60 * 60 * 1000), false);
    assert.equal(yellowReviewIsDue(scannedAt + 30 * 24 * 60 * 60 * 1000), true);
  } finally {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previous });
  }
});
