import assert from "node:assert/strict";
import test from "node:test";
import { deleteSelectedFiles } from "../lib/scanner/delete";
import { fullHash } from "../lib/scanner/hash";
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

async function duplicateFixture() {
  const contents = new Map([
    ["copy.txt", new File(["same"], "copy.txt", { lastModified: 100 })],
    ["keeper.txt", new File(["same"], "keeper.txt", { lastModified: 100 })],
  ]);
  const directory = {
    async requestPermission() { return "granted" as PermissionState; },
    async getFileHandle(name: string) {
      const file = contents.get(name);
      if (!file) throw new Error("File missing");
      return { async getFile() { return file; } };
    },
    async removeEntry(name: string) { contents.delete(name); },
  } as unknown as FileSystemDirectoryHandle;
  const duplicateGroup = `4:${await fullHash(contents.get("copy.txt")!)}`;
  const scannedFiles: ScanFile[] = ["copy.txt", "keeper.txt"].map((name, index) => ({
    id: String(index), name, path: name, size: 4, lastModified: 100,
    categories: ["duplicate"], duplicateGroup, parentDirectory: directory,
  }));
  return { directory, contents, scannedFiles };
}

test("deletes duplicate only while its content and keeper still match the scan", async () => {
  const { directory, contents, scannedFiles } = await duplicateFixture();
  const result = await deleteSelectedFiles(directory, [scannedFiles[0]], scannedFiles);
  assert.equal(result.deleted.has("0"), true);
  assert.equal(contents.has("copy.txt"), false);
  assert.equal(contents.has("keeper.txt"), true);
});

test("does not delete duplicate whose content changed without metadata changing", async () => {
  const { directory, contents, scannedFiles } = await duplicateFixture();
  contents.set("copy.txt", new File(["else"], "copy.txt", { lastModified: 100 }));
  const result = await deleteSelectedFiles(directory, [scannedFiles[0]], scannedFiles);
  assert.deepEqual(result.failures, ["copy.txt"]);
  assert.equal(contents.has("copy.txt"), true);
});

test("does not delete the last available duplicate copy", async () => {
  const { directory, contents, scannedFiles } = await duplicateFixture();
  contents.delete("keeper.txt");
  const result = await deleteSelectedFiles(directory, [scannedFiles[0]], scannedFiles);
  assert.deepEqual(result.failures, ["copy.txt"]);
  assert.equal(contents.has("copy.txt"), true);
});
