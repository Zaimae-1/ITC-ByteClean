import { Suspense } from "react";
import { SiteHeader } from "../components/site-header";
import { ScanWorkspace } from "./scan-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, type ScanSettings } from "@/lib/scanner/types";

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
  let settings: ScanSettings = DEFAULT_SETTINGS;
  const client = await createSupabaseServerClient();
  if (client) {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      const { data: membership } = await client.from("memberships").select("organization_id").eq("user_id", user.id).maybeSingle();
      if (membership) {
        const { data: org } = await client.from("organizations").select("large_file_bytes, old_file_days, old_installer_days").eq("id", membership.organization_id).single();
        if (org) settings = { largeFileBytes: org.large_file_bytes, oldFileDays: org.old_file_days, oldInstallerDays: org.old_installer_days, maxFiles: DEFAULT_SETTINGS.maxFiles };
      }
    }
  }
  return <ScanWorkspace initialDemo={demo === "1"} settings={settings} />;
}
