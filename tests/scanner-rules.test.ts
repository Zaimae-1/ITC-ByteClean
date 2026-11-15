import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSummary,
  classifyFile,
  validateDeletionSelection,
} from "../lib/scanner/rules";
import { DEFAULT_SETTINGS, type ScanFile } from "../lib/scanner/types";

const now = Date.UTC(2026, 10, 15);
const daysAgo = (days: number) => now - days * 86_400_000;

test("classifies metadata conservatively", () => {
  assert.deepEqual(
    classifyFile(
      { name: "setup.exe", size: 150 * 1024 * 1024, lastModified: daysAgo(200) },
      DEFAULT_SETTINGS,
      now,
    ),
    ["largeOld", "oldInstaller"],
  );
  assert.deepEqual(
    classifyFile({ name: "important-copy.txt", size: 0, lastModified: 0 }, DEFAULT_SETTINGS, now),
    ["empty", "namedCopy"],
  );
  assert.deepEqual(
    classifyFile({ name: "program.exe", size: 10, lastModified: daysAgo(200) }, DEFAULT_SETTINGS, now),
    [],
  );
});

test("counts one removable duplicate and avoids category overlap", () => {
  const files: ScanFile[] = [
    { id: "a", name: "a.tmp", path: "a.tmp", size: 10, lastModified: now, categories: ["duplicate", "temporary"], duplicateGroup: "g" },
    { id: "b", name: "b.tmp", path: "b.tmp", size: 10, lastModified: now, categories: ["duplicate", "temporary"], duplicateGroup: "g" },
    { id: "c", name: "c.txt", path: "c.txt", size: 80, lastModified: now, categories: [] },
  ];
  const summary = calculateSummary(files);
  assert.equal(summary.totalBytes, 100);
  assert.equal(summary.potentialBytes, 10);
  assert.equal(summary.potentialFiles, 1);
  assert.equal(summary.score, 90);
  assert.equal(summary.categories.duplicate.count, 1);
  assert.equal(summary.categories.temporary.count, 1);
  assert.match(validateDeletionSelection(files, new Set(["a", "b"])) ?? "", /satu salinan/);
  assert.equal(validateDeletionSelection(files, new Set(["b"])), null);
});

test("empty scans have no score", () => {
  assert.equal(calculateSummary([]).score, null);
});
