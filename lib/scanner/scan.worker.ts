import { findDuplicates } from "./hash";
import { classifyFile } from "./rules";
import type { ScanFile } from "./types";
import type { ScanRequest, ScanResponse } from "./worker-protocol";

interface CollectedFile {
  file: File;
  result: ScanFile;
}

function send(message: ScanResponse) {
  self.postMessage(message);
}

async function runScan(request: ScanRequest) {
  const { source, settings } = request;
  const collected: CollectedFile[] = [];
  let skippedFiles = 0;

  function add(file: File, path: string, parentDirectory?: FileSystemDirectoryHandle) {
    if (collected.length >= settings.maxFiles) {
      throw new Error(`Batas ${settings.maxFiles.toLocaleString("id-ID")} file terlampaui. Pilih subfolder yang lebih kecil.`);
    }
    const id = `file-${collected.length + 1}`;
    collected.push({
      file,
      result: {
        id,
        name: file.name,
        path,
        size: file.size,
        lastModified: file.lastModified,
        categories: classifyFile(file, settings),
        parentDirectory,
      },
    });
    if (collected.length % 25 === 0) {
      send({ type: "progress", phase: "collecting", scannedFiles: collected.length, skippedFiles });
    }
  }

  if (source.kind === "files") {
    for (const entry of source.entries) add(entry.file, entry.path);
  } else {
    const stack: { handle: FileSystemDirectoryHandle; path: string }[] = [
      { handle: source.handle, path: "" },
    ];
    while (stack.length) {
      const current = stack.pop()!;
      for await (const [name, handle] of current.handle as FileSystemDirectoryHandle & AsyncIterable<[string, FileSystemHandle]>) {
        const path = current.path ? `${current.path}/${name}` : name;
        if (handle.kind === "directory") {
          stack.push({ handle: handle as FileSystemDirectoryHandle, path });
          continue;
        }
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          add(file, path, current.handle);
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Batas ")) throw error;
          skippedFiles += 1;
        }
      }
    }
  }

  send({ type: "progress", phase: "collecting", scannedFiles: collected.length, skippedFiles });
  const duplicates = await findDuplicates(
    collected.map(({ file, result }) => ({ id: result.id, file })),
    (processedBytes, totalBytes) => {
      send({
        type: "progress",
        phase: "hashing",
        scannedFiles: collected.length,
        processedBytes,
        totalBytes,
      });
    },
  );
  for (const { result } of collected) {
    const group = duplicates.get(result.id);
    if (group) {
      result.duplicateGroup = group;
      result.categories.unshift("duplicate");
    }
  }
  send({ type: "complete", files: collected.map(({ result }) => result), skippedFiles });
}

self.onmessage = (event: MessageEvent<ScanRequest>) => {
  if (event.data.type !== "start") return;
  runScan(event.data).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Pemindaian gagal.";
    send({ type: "error", message, limitExceeded: message.startsWith("Batas ") });
  });
};
