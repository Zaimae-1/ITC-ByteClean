import { Suspense } from "react";
import { SiteHeader } from "../components/site-header";
import { ScanWorkspace } from "./scan-workspace";

export default function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="mx-auto max-w-6xl px-5 py-12 text-slate-600">Menyiapkan pemindaian...</p>}>
        <ScanPageContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ScanPageContent({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  return <ScanWorkspace initialDemo={demo === "1"} />;
}
