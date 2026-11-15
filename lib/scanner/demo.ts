import type { ScanFile } from "./types";

export function createDemoFiles(): ScanFile[] {
  const old = Date.UTC(2025, 0, 5);
  const recent = Date.UTC(2026, 10, 1);
  return [
    { id: "demo-1", name: "laporan-final.pdf", path: "Dokumen/laporan-final.pdf", size: 4_200_000, lastModified: old, categories: ["duplicate"], duplicateGroup: "demo-duplicate" },
    { id: "demo-2", name: "laporan-final-salinan.pdf", path: "Unduhan/laporan-final-salinan.pdf", size: 4_200_000, lastModified: old, categories: ["duplicate", "namedCopy"], duplicateGroup: "demo-duplicate" },
    { id: "demo-3", name: "arsip-2024.zip", path: "Arsip/arsip-2024.zip", size: 680_000_000, lastModified: old, categories: ["largeOld"] },
    { id: "demo-4", name: "video-lama.mp4", path: "Video/video-lama.mp4", size: 320_000_000, lastModified: old, categories: ["largeOld"] },
    { id: "demo-5", name: "download.part", path: "Unduhan/download.part", size: 87_000_000, lastModified: recent, categories: ["temporary"] },
    { id: "demo-6", name: "setup-aplikasi.exe", path: "Unduhan/setup-aplikasi.exe", size: 124_000_000, lastModified: old, categories: ["oldInstaller"] },
    { id: "demo-7", name: "catatan-kosong.txt", path: "Dokumen/catatan-kosong.txt", size: 0, lastModified: recent, categories: ["empty"] },
    { id: "demo-8", name: "proposal-copy.docx", path: "Dokumen/proposal-copy.docx", size: 2_100_000, lastModified: recent, categories: ["namedCopy"] },
    { id: "demo-9", name: "presentasi-final.pptx", path: "Dokumen/presentasi-final.pptx", size: 12_000_000, lastModified: recent, categories: [] },
  ];
}
