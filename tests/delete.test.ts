import assert from "node:assert/strict";
import test from "node:test";
import { deleteSelectedFiles } from "../lib/scanner/delete";
import type { ScanFile } from "../lib/scanner/types";

function fixture(size = 12, lastModified = 100) {
  const removed: string[] = [];
  const directory = {
    async requestPermission() { return "granted" as PermissionState; },
    async getFileHandle() { return { async getFile() { return { size, lastModified }; } }; },
    async removeEntry(name: string) { removed.push(name); },
  } as unknown as FileSystemDirectoryHandle;
  const file: ScanFile = { id: "one", name: "old.tmp", path: "test/old.tmp", size: 12, lastModified: 100, categories: ["temporary"], parentDirectory: directory };
  return { directory, file, removed };
}

test("deletes selected file after granting permission and checking metadata", async () => {
  const { directory, file, removed } = fixture();
  const result = await deleteSelectedFiles(directory, [file]);
  assert.deepEqual(removed, ["old.tmp"]);
  assert.deepEqual([...result.deleted], ["one"]);
  assert.equal(result.bytes, 12);
});

test("skips changed file without deleting it", async () => {
  const { directory, file, removed } = fixture(13);
  const result = await deleteSelectedFiles(directory, [file]);
  assert.deepEqual(removed, []);
  assert.deepEqual(result.failures, ["test/old.tmp"]);
});

test("refuses deletion when write permission is denied", async () => {
  const { file, removed } = fixture();
  const directory = { async requestPermission() { return "denied" as PermissionState; } } as unknown as FileSystemDirectoryHandle;
  await assert.rejects(() => deleteSelectedFiles(directory, [file]), /Izin tulis/);
  assert.deepEqual(removed, []);
});
