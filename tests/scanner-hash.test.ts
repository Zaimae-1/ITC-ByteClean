import assert from "node:assert/strict";
import test from "node:test";
import { findDuplicates, fullHash } from "../lib/scanner/hash";

test("streaming SHA-256 matches known digest", async () => {
  const file = new File(["abc"], "a.txt");
  assert.equal(
    await fullHash(file),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("same size and partial content do not imply a duplicate", async () => {
  const head = "x".repeat(64 * 1024);
  const tail = "y".repeat(64 * 1024);
  const a = new File([head, "A", tail], "a.bin");
  const b = new File([head, "B", tail], "b.bin");
  const c = new File([head, "A", tail], "c.bin");
  const groups = await findDuplicates([
    { id: "a", file: a },
    { id: "b", file: b },
    { id: "c", file: c },
  ]);
  assert.equal(groups.get("a"), groups.get("c"));
  assert.equal(groups.has("b"), false);
});
