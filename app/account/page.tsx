import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrganization, joinOrganization } from "./actions";
import { AdminControls } from "./admin-controls";
import { formatBytes } from "@/lib/scanner/rules";

export const instant = false;

type Dashboard = { memberCount: number; scanCount: number; averageScore: number | null; totalPotentialBytes: number; totalDeletedBytes: number; monthly: { month: string; scans: number; deletedBytes: number }[] };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createSupabaseServerClient();
  if (!client) return <main className="mx-auto max-w-4xl px-5 py-14"><h1 className="text-3xl font-bold">Organisasi belum terhubung</h1><p className="mt-3 text-slate-600">Konfigurasi Supabase diperlukan untuk akun dan dasbor. Pemindaian lokal tetap tersedia.</p><Link href="/scan" className="mt-6 inline-block font-semibold text-teal-700">Buka pemindaian →</Link></main>;
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth");
  const { error: queryError } = await searchParams;
  const { data: membership } = await client.from("memberships").select("organization_id, role, unit").eq("user_id", user.id).maybeSingle();
  if (!membership) return <main className="mx-auto max-w-4xl px-5 py-14"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Akun {user.email}</p><h1 className="mt-2 text-4xl font-bold">Pilih organisasi</h1><p className="mt-3 text-slate-600">Buat organisasi untuk menjadi admin, atau gunakan kode undangan dari admin Anda.</p>{queryError && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{queryError}</p>}<div className="mt-8 grid gap-6 md:grid-cols-2"><form action={createOrganization} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Buat organisasi</h2><label className="mt-5 grid gap-2 text-sm">Nama organisasi<input name="name" required minLength={2} maxLength={100} className="rounded-lg border border-slate-300 px-3 py-2" /></label><button className="mt-5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Buat</button></form><form action={joinOrganization} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Gabung organisasi</h2><label className="mt-5 grid gap-2 text-sm">Kode undangan<input name="code" required className="rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase" /></label><label className="mt-4 grid gap-2 text-sm">Unit (opsional)<input name="unit" maxLength={80} className="rounded-lg border border-slate-300 px-3 py-2" /></label><button className="mt-5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Gabung</button></form></div></main>;
  const { data: org } = await client.from("organizations").select("name, large_file_bytes, old_file_days, old_installer_days").eq("id", membership.organization_id).single();
  if (!org) return <main className="mx-auto max-w-4xl px-5 py-14"><h1 className="text-2xl font-bold">Organisasi tidak tersedia</h1><p className="mt-3">Muat ulang halaman atau hubungi admin.</p></main>;
  const isAdmin = membership.role === "admin";
  const [dashboardResult, invitesResult] = isAdmin ? await Promise.all([
    client.rpc("get_admin_dashboard"), client.rpc("list_invites"),
  ]) : [{ data: null, error: null }, { data: null, error: null }];
  const dashboard = dashboardResult.data as Dashboard | null;
  return <main className="mx-auto max-w-6xl px-5 py-14"><p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">{isAdmin ? "Dasbor admin" : "Anggota organisasi"}</p><h1 className="mt-2 text-4xl font-bold">{org.name}</h1><p className="mt-3 text-slate-600">{user.email} · {isAdmin ? "Admin" : membership.unit || "Anggota"}</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/scan" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Mulai pindai</Link><Link href="/history" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Lihat riwayat</Link></div>{isAdmin && <><section className="mt-10"><h2 className="text-2xl font-bold">Ringkasan organisasi</h2><p className="mt-2 text-sm text-slate-600">Hanya angka gabungan. Nama dan jalur file tidak tersimpan di server.</p>{dashboardResult.error ? <p role="alert" className="mt-4 text-red-700">{dashboardResult.error.message}</p> : <><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Anggota" value={String(dashboard?.memberCount ?? 0)} /><Metric label="Pindai" value={String(dashboard?.scanCount ?? 0)} /><Metric label="Rata-rata skor" value={dashboard?.averageScore == null ? "—" : String(dashboard.averageScore)} /><Metric label="Potensi ruang" value={formatBytes(dashboard?.totalPotentialBytes ?? 0)} /><Metric label="Dibebaskan" value={formatBytes(dashboard?.totalDeletedBytes ?? 0)} /></div>{dashboard?.monthly && dashboard.monthly.length > 0 && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold">Tren bulanan</h3><div className="mt-4 space-y-2">{dashboard.monthly.map((item) => <div key={item.month} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-sm"><span>{item.month}</span><span>{item.scans} pindai · {formatBytes(item.deletedBytes)} dibebaskan</span></div>)}</div></div>}</>}</section><AdminControls initialInvites={(invitesResult.data ?? []) as never[]} settings={org} /></>}</main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}
