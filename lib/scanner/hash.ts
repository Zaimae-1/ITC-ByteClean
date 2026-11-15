import { sha256 } from "@noble/hashes/sha2.js";

const SAMPLE_BYTES = 64 * 1024;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function partialHash(file: File): Promise<string> {
  const head = new Uint8Array(await file.slice(0, SAMPLE_BYTES).arrayBuffer());
  if (file.size <= SAMPLE_BYTES) return toHex(sha256(head));
  const tail = new Uint8Array(await file.slice(-SAMPLE_BYTES).arrayBuffer());
  const sample = new Uint8Array(head.length + tail.length);
  sample.set(head);
  sample.set(tail, head.length);
  return toHex(sha256(sample));
}

export async function fullHash(
  file: File,
  onChunk?: (bytes: number) => void,
): Promise<string> {
  const hash = sha256.create();
  const reader = file.stream().getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
      onChunk?.(value.byteLength);
    }
    return toHex(hash.digest());
  } finally {
    reader.releaseLock();
  }
}

export interface HashCandidate {
  id: string;
  file: File;
}

export async function findDuplicates(
  candidates: HashCandidate[],
  onProgress?: (processedBytes: number, totalBytes: number) => void,
): Promise<Map<string, string>> {
  const bySize = new Map<number, HashCandidate[]>();
  for (const candidate of candidates) {
    const group = bySize.get(candidate.file.size) ?? [];
    group.push(candidate);
    bySize.set(candidate.file.size, group);
  }

  const byPartial = new Map<string, HashCandidate[]>();
  for (const [size, group] of bySize) {
    if (group.length < 2) continue;
    for (const candidate of group) {
      const key = `${size}:${await partialHash(candidate.file)}`;
      const matches = byPartial.get(key) ?? [];
      matches.push(candidate);
      byPartial.set(key, matches);
    }
  }

  const toVerify = [...byPartial.values()].filter((group) => group.length > 1);
  const totalBytes = toVerify.reduce(
    (total, group) => total + group.reduce((size, candidate) => size + candidate.file.size, 0),
    0,
  );
  let processedBytes = 0;
  onProgress?.(0, totalBytes);
  const byFullHash = new Map<string, HashCandidate[]>();
  for (const group of toVerify) {
    for (const candidate of group) {
      const digest = await fullHash(candidate.file, (bytes) => {
        processedBytes += bytes;
        onProgress?.(processedBytes, totalBytes);
      });
      const key = `${candidate.file.size}:${digest}`;
      const matches = byFullHash.get(key) ?? [];
      matches.push(candidate);
      byFullHash.set(key, matches);
    }
  }

  const duplicates = new Map<string, string>();
  for (const [key, group] of byFullHash) {
    if (group.length < 2) continue;
    for (const candidate of group) duplicates.set(candidate.id, key);
  }
  return duplicates;
}
