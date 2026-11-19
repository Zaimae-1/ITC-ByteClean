import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "./components/site-header";
import { MonthlyReminder } from "./components/monthly-reminder";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITC ByteClean",
  description: "Tinjau dan bersihkan file lokal yang tidak diperlukan dengan kendali penuh di tangan Anda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Suspense fallback={<div className="h-[73px] border-b border-slate-200 bg-white" />}><SiteHeader /></Suspense><MonthlyReminder />{children}</body>
    </html>
  );
}
