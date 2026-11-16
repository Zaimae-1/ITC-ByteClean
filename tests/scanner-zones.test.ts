import assert from "node:assert/strict";
import test from "node:test";
import { potentialFileIds } from "../lib/scanner/rules";
import { groupByZone, zoneForFile } from "../lib/scanner/zones";
import type { ScanFile } from "../lib/scanner/types";

const now = Date.UTC(2026, 10, 16);
const file = (id: string, categories: ScanFile["categories"], lastModified = now): ScanFile => ({
  id, name: `${id}.tmp`, path: id, size: 10, lastModified, categories,
});

test("protects the duplicate keeper and unflagged files", () => {
  const a = { ...file("a", ["duplicate"]), duplicateGroup: "group" };
  const b = { ...file("b", ["duplicate"]), duplicateGroup: "group" };
  const plain = file("plain", []);
  const files = [a, b, plain];
  const groups = groupByZone(files, potentialFileIds(files), now);
  assert.deepEqual(groups.green.map((item) => item.id), ["b"]);
  assert.deepEqual(groups.red.map((item) => item.id), ["a", "plain"]);
});

test("only old temporary files enter quick cleanup", () => {
  const recent = file("recent", ["temporary"]);
  const old = file("old", ["temporary"], now - 31 * 24 * 60 * 60 * 1000);
  const candidates = new Set([recent.id, old.id]);
  assert.equal(zoneForFile(recent, candidates, now), "yellow");
  assert.equal(zoneForFile(old, candidates, now), "green");
});

test("protecting a file removes it from cleanup zones", () => {
  const item = file("protected", ["temporary"], now - 31 * 24 * 60 * 60 * 1000);
  assert.equal(zoneForFile(item, new Set(), now), "red");
});
