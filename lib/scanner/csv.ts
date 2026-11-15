import { CATEGORY_LABELS, type ScanFile } from "./types";

function cell(value: string | number): string {
  const text = String(value);
  // Prevent spreadsheet applications from treating a filename as a formula.
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function filesToCsv(files: ScanFile[]): string {
  const header = ["Nama", "Jalur relatif", "Ukuran (byte)", "Terakhir diubah", "Kategori"];
  const rows = files.map((file) => [
    file.name,
    file.path,
    file.size,
    new Date(file.lastModified).toISOString(),
    file.categories.map((category) => CATEGORY_LABELS[category]).join("; "),
  ]);
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}
