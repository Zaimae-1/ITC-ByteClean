import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/scanner/rules";
import { createOrganization, joinOrganization } from "./actions";
import { AdminControls, type Invite } from "./admin-controls";
import { AdminTrend, type MonthTotal } from "./admin-trend";

export const instant = false;

type Dashboard = {
  memberCount: number;
  scanCount: number;
  averageScore: number | null;
  totalPotentialBytes: number;
  totalDeletedBytes: number;
  monthly: MonthTotal[];
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createSupabaseServerClient();
  if (!client) return <main className="mx-auto max-w-4xl px-5 py-14"><h1 className="text-3xl font-bold">Organisasi belum terhubung</h1><p className="mt-3 text-slate-600">Konfigurasi Supabase diperlukan untuk akun dan dasbor. Pemindaian lokal tetap tersedia.</p><Link href="/scan" className="mt-6 inline-block font-semibold text-teal-700">Buka pemindaian →</Link></main>;

  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { error: queryError } = await searchParams;
  const { data: membership } = await client.from("memberships").select("organization_id, role, unit").eq("user_id", user.id).maybeSingle();
  if (!membership) return <ChooseOrganization email={user.email ?? ""} error={queryError} />;

  const { data: org } = await client.from("organizations").select("name, large_file_bytes, old_file_days, old_installer_days").eq("id", membership.organization_id).single();
  if (!org) return <main className="mx-auto max-w-4xl px-5 py-14"><h1 className="text-2xl font-bold">Organisasi tidak tersedia</h1><p className="mt-3">Muat ulang halaman atau hubungi admin.</p></main>;

  const isAdmin = membership.role === "admin";
  const [dashboardResult, invitesResult] = isAdmin ? await Promise.all([
    client.rpc("get_admin_dashboard"), client.rpc("list_invites"),
  ]) : [{ data: null, error: null }, { data: null, error: null }];
  const dashboard = dashboardResult.data as Dashboard | null;

  return <main className="mx-auto max-w-6xl px-5 py-14">
    <div className="rounded-3xl border border-[#d5e2da] bg-[#eef5ef] px-6 py-8 text-[#243331] sm:px-9">
      <p className="text-sm font-semibold text-[#285e53]">{isAdmin ? "Dasbor admin" : "Ruang organisasi"}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{org.name}</h1>
      <p className="mt-3 text-sm text-[#526a63]">{user.email} · {isAdmin ? "Admin" : membership.unit || "Anggota"}</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/scan" className="inline-flex min-h-11 items-center rounded-lg bg-[#2e7066] px-4 py-2 font-semibold text-white hover:bg-[#24594f]">Mulai pindai</Link><Link href="/history" className="inline-flex min-h-11 items-center rounded-lg border border-[#b9d0c1] px-4 py-2 font-semibold text-[#285e53] hover:bg-white">Lihat riwayat</Link></div>
    </div>

    {isAdmin && <>
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Hasil gabungan</p><h2 className="mt-1 text-2xl font-bold">Ringkasan organisasi</h2></div><p className="text-sm text-slate-500">Nama dan jalur file tidak tersimpan di server.</p></div>
        {dashboardResult.error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">Ringkasan belum bisa dimuat. Coba muat ulang halaman.</p> : <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Anggota" value={String(dashboard?.memberCount ?? 0)} />
            <Metric label="Pindai" value={String(dashboard?.scanCount ?? 0)} />
            <Metric label="Rata-rata skor" value={dashboard?.averageScore == null ? "—" : String(dashboard.averageScore)} />
            <Metric label="Potensi ruang" value={formatBytes(dashboard?.totalPotentialBytes ?? 0)} />
            <Metric label="Dilaporkan dibebaskan" value={formatBytes(dashboard?.totalDeletedBytes ?? 0)} />
          </div>
          <AdminTrend months={dashboard?.monthly ?? []} />
        </>}
      </section>
      <AdminControls initialInvites={(invitesResult.data ?? []) as Invite[]} settings={org} />
    </>}
  </main>;
}

function ChooseOrganization({ email, error }: { email: string; error?: string }) {
  return <main className="mx-auto max-w-4xl px-5 py-14">
    <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Akun {email}</p>
    <h1 className="mt-2 text-4xl font-bold">Pilih organisasi</h1>
    <p className="mt-3 text-slate-600">Buat organisasi untuk menjadi admin, atau gunakan kode undangan dari admin Anda.</p>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <form action={createOrganization} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-xl text-teal-700">+</span><h2 className="mt-4 text-xl font-bold">Buat organisasi</h2><p className="mt-2 text-sm text-slate-600">Kelola anggota, aturan pindai, dan ringkasan gabungan.</p><label className="mt-5 grid gap-2 text-sm">Nama organisasi<input name="name" required minLength={2} maxLength={100} className="rounded-lg border border-slate-300 px-3 py-2" /></label><button className="mt-5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Buat organisasi</button></form>
      <form action={joinOrganization} className="rounded-2xl border border-slate-200 bg-white p-6"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-sky-50 text-xl text-sky-700">↗</span><h2 className="mt-4 text-xl font-bold">Gabung organisasi</h2><p className="mt-2 text-sm text-slate-600">Gunakan kode yang dibagikan admin organisasi Anda.</p><label className="mt-5 grid gap-2 text-sm">Kode undangan<input name="code" required className="rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase" /></label><label className="mt-4 grid gap-2 text-sm">Unit (opsional)<input name="unit" maxLength={80} className="rounded-lg border border-slate-300 px-3 py-2" /></label><button className="mt-5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Gabung</button></form>
    </div>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>;
}
