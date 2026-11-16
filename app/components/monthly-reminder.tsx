"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { scheduleYellowReview, yellowReviewIsDue } from "@/lib/scanner/reminder";

export function MonthlyReminder() {
  const [due, setDue] = useState(false);
  useEffect(() => {
    const check = () => setDue(yellowReviewIsDue(Date.now()));
    const timer = window.setTimeout(check, 0);
    window.addEventListener("byteclean-reminder-updated", check);
    return () => { window.clearTimeout(timer); window.removeEventListener("byteclean-reminder-updated", check); };
  }, []);
  if (!due) return null;
  return <div role="status" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-amber-950"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3"><p><strong>Sudah sebulan sejak pemeriksaan terakhir.</strong> Pindai ulang file yang perlu diperiksa.</p><div className="flex items-center gap-4"><Link href="/scan" className="font-bold underline underline-offset-4">Pindai sekarang</Link><button onClick={() => { scheduleYellowReview(Date.now()); setDue(false); }} className="font-semibold text-amber-800 hover:underline">Ingatkan bulan depan</button></div></div></div>;
}
