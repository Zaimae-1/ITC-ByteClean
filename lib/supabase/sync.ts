import { db, type ScanRecord } from "@/lib/db";
import { CATEGORIES } from "@/lib/scanner/types";
import { createSupabaseBrowserClient } from "./browser";
import { hasSupabaseConfig } from "./config";

export async function syncScanRecord(record: ScanRecord): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const client = createSupabaseBrowserClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, record.summary.categories[category].count]));
  const bytes = Object.fromEntries(CATEGORIES.map((category) => [category, record.summary.categories[category].bytes]));
  const { data: remoteId, error } = await client.rpc("submit_scan", {
    p_client_id: record.clientId,
    p_created_at: new Date(record.createdAt).toISOString(),
    p_total_files: record.summary.totalFiles,
    p_total_bytes: record.summary.totalBytes,
    p_potential_files: record.summary.potentialFiles,
    p_potential_bytes: record.summary.potentialBytes,
    p_score: record.summary.score,
    p_category_counts: counts,
    p_category_bytes: bytes,
  });
  if (error) return false;
  if (record.id !== undefined) await db.scans.update(record.id, { remoteId: String(remoteId) });
  if (record.deletedFiles > 0) {
    const { error: cleanupError } = await client.rpc("record_cleanup", {
      p_client_id: record.clientId,
      p_deleted_files: record.deletedFiles,
      p_deleted_bytes: record.deletedBytes,
    });
    if (cleanupError) return false;
    if (record.id !== undefined) await db.scans.update(record.id, { remoteDeletedFiles: record.deletedFiles });
  }
  return true;
}

export async function syncPendingScans(): Promise<void> {
  if (!hasSupabaseConfig()) return;
  const records = await db.scans.toArray();
  for (const record of records.filter((item) => !item.remoteId || (item.remoteDeletedFiles ?? 0) < item.deletedFiles)) await syncScanRecord(record);
}
