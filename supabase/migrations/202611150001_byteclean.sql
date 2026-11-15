create extension if not exists pgcrypto with schema extensions;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 100),
  large_file_bytes bigint not null default 104857600 check (large_file_bytes between 1048576 and 107374182400),
  old_file_days integer not null default 180 check (old_file_days between 1 and 3650),
  old_installer_days integer not null default 90 check (old_installer_days between 1 and 3650),
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  unit text not null default '' check (length(unit) <= 80),
  created_at timestamptz not null default now()
);
create index memberships_organization_id_idx on public.memberships (organization_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code_hash bytea not null unique,
  expires_at timestamptz not null,
  max_uses integer not null check (max_uses between 1 and 1000),
  uses integer not null default 0 check (uses >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invites_organization_id_idx on public.invites (organization_id);

create table public.scan_summaries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  total_files integer not null check (total_files between 0 and 1000000),
  total_bytes bigint not null check (total_bytes >= 0),
  potential_files integer not null check (potential_files between 0 and total_files),
  potential_bytes bigint not null check (potential_bytes between 0 and total_bytes),
  score integer check (score between 0 and 100),
  category_counts jsonb not null,
  category_bytes jsonb not null,
  deleted_files integer not null default 0 check (deleted_files between 0 and total_files),
  deleted_bytes bigint not null default 0 check (deleted_bytes between 0 and total_bytes),
  unique (user_id, client_id)
);
create index scan_summaries_org_created_idx on public.scan_summaries (organization_id, created_at desc);
create index scan_summaries_user_created_idx on public.scan_summaries (user_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.scan_summaries enable row level security;

create policy "Members read own organization" on public.organizations for select to authenticated
  using (id = (select organization_id from public.memberships where user_id = (select auth.uid())));
create policy "Members read own membership" on public.memberships for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Members read own scans" on public.scan_summaries for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.organizations, public.memberships, public.invites, public.scan_summaries from anon, authenticated;
grant select on public.organizations, public.memberships, public.scan_summaries to authenticated;

create or replace function public.create_organization(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then raise exception 'Already in an organization'; end if;
  insert into public.organizations(name) values (btrim(p_name)) returning id into v_id;
  insert into public.memberships(user_id, organization_id, role) values (auth.uid(), v_id, 'admin');
  return v_id;
end $$;

create or replace function public.create_invite(p_max_uses integer default 10, p_valid_days integer default 7)
returns text language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_code text;
begin
  select organization_id into v_org from public.memberships where user_id = auth.uid() and role = 'admin';
  if v_org is null then raise exception 'Admin required'; end if;
  if p_max_uses not between 1 and 1000 or p_valid_days not between 1 and 30 then raise exception 'Invalid invite limits'; end if;
  v_code := upper(encode(extensions.gen_random_bytes(12), 'hex'));
  insert into public.invites(organization_id, code_hash, expires_at, max_uses)
  values (v_org, extensions.digest(v_code, 'sha256'), now() + make_interval(days => p_valid_days), p_max_uses);
  return v_code;
end $$;

create or replace function public.join_organization(p_code text, p_unit text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_invite public.invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then raise exception 'Already in an organization'; end if;
  if length(p_unit) > 80 then raise exception 'Unit name too long'; end if;
  select * into v_invite from public.invites
  where code_hash = extensions.digest(upper(btrim(p_code)), 'sha256') for update;
  if v_invite.id is null or v_invite.revoked_at is not null or v_invite.expires_at <= now() or v_invite.uses >= v_invite.max_uses then
    raise exception 'Invite unavailable';
  end if;
  insert into public.memberships(user_id, organization_id, role, unit)
  values (auth.uid(), v_invite.organization_id, 'member', btrim(p_unit));
  update public.invites set uses = uses + 1 where id = v_invite.id;
  return v_invite.organization_id;
end $$;

create or replace function public.list_invites()
returns table(id uuid, expires_at timestamptz, max_uses integer, uses integer, revoked_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
  select m.organization_id into v_org from public.memberships m where m.user_id = auth.uid() and m.role = 'admin';
  if v_org is null then raise exception 'Admin required'; end if;
  return query select i.id, i.expires_at, i.max_uses, i.uses, i.revoked_at, i.created_at
    from public.invites i where i.organization_id = v_org order by i.created_at desc;
end $$;

create or replace function public.revoke_invite(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.memberships where user_id = auth.uid() and role = 'admin';
  if v_org is null then raise exception 'Admin required'; end if;
  update public.invites set revoked_at = now() where id = p_id and organization_id = v_org and revoked_at is null;
end $$;

create or replace function public.update_organization_settings(p_large_file_bytes bigint, p_old_file_days integer, p_old_installer_days integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.memberships where user_id = auth.uid() and role = 'admin';
  if v_org is null then raise exception 'Admin required'; end if;
  update public.organizations set large_file_bytes = p_large_file_bytes, old_file_days = p_old_file_days,
    old_installer_days = p_old_installer_days where id = v_org;
end $$;

create or replace function public.submit_scan(
  p_client_id uuid, p_created_at timestamptz, p_total_files integer, p_total_bytes bigint,
  p_potential_files integer, p_potential_bytes bigint, p_score integer,
  p_category_counts jsonb, p_category_bytes jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_id uuid; v_key text;
begin
  select organization_id into v_org from public.memberships where user_id = auth.uid();
  if v_org is null then raise exception 'Organization membership required'; end if;
  if p_created_at > now() + interval '5 minutes' or p_created_at < now() - interval '90 days' then raise exception 'Invalid scan date'; end if;
  foreach v_key in array array['duplicate','largeOld','temporary','oldInstaller','empty','namedCopy'] loop
    if jsonb_typeof(p_category_counts -> v_key) is distinct from 'number'
      or jsonb_typeof(p_category_bytes -> v_key) is distinct from 'number'
      or (p_category_counts ->> v_key)::numeric not between 0 and p_total_files
      or (p_category_bytes ->> v_key)::numeric not between 0 and p_total_bytes
      or (p_category_counts ->> v_key)::numeric <> trunc((p_category_counts ->> v_key)::numeric)
      or (p_category_bytes ->> v_key)::numeric <> trunc((p_category_bytes ->> v_key)::numeric) then
      raise exception 'Invalid category values';
    end if;
  end loop;
  insert into public.scan_summaries(client_id, user_id, organization_id, created_at, total_files, total_bytes,
    potential_files, potential_bytes, score, category_counts, category_bytes)
  values (p_client_id, auth.uid(), v_org, p_created_at, p_total_files, p_total_bytes, p_potential_files,
    p_potential_bytes, p_score,
    jsonb_build_object('duplicate', p_category_counts->'duplicate', 'largeOld', p_category_counts->'largeOld',
      'temporary', p_category_counts->'temporary', 'oldInstaller', p_category_counts->'oldInstaller',
      'empty', p_category_counts->'empty', 'namedCopy', p_category_counts->'namedCopy'),
    jsonb_build_object('duplicate', p_category_bytes->'duplicate', 'largeOld', p_category_bytes->'largeOld',
      'temporary', p_category_bytes->'temporary', 'oldInstaller', p_category_bytes->'oldInstaller',
      'empty', p_category_bytes->'empty', 'namedCopy', p_category_bytes->'namedCopy'))
  on conflict (user_id, client_id) do nothing returning id into v_id;
  if v_id is null then select id into v_id from public.scan_summaries where user_id = auth.uid() and client_id = p_client_id; end if;
  return v_id;
end $$;

create or replace function public.record_cleanup(p_client_id uuid, p_deleted_files integer, p_deleted_bytes bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_deleted_files < 0 or p_deleted_bytes < 0 then raise exception 'Invalid cleanup totals'; end if;
  update public.scan_summaries set deleted_files = p_deleted_files, deleted_bytes = p_deleted_bytes
  where user_id = auth.uid() and client_id = p_client_id
    and p_deleted_files >= deleted_files and p_deleted_files <= total_files
    and p_deleted_bytes >= deleted_bytes and p_deleted_bytes <= total_bytes;
  if not found then raise exception 'Scan unavailable or cleanup totals invalid'; end if;
end $$;

create or replace function public.get_admin_dashboard()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_result jsonb;
begin
  select organization_id into v_org from public.memberships where user_id = auth.uid() and role = 'admin';
  if v_org is null then raise exception 'Admin required'; end if;
  select jsonb_build_object(
    'memberCount', (select count(*) from public.memberships where organization_id = v_org),
    'scanCount', count(*),
    'averageScore', round(avg(score)::numeric, 1),
    'totalPotentialBytes', coalesce(sum(potential_bytes), 0),
    'totalDeletedBytes', coalesce(sum(deleted_bytes), 0),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object('month', month, 'scans', scans, 'deletedBytes', deleted_bytes) order by month)
      from (select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*) as scans,
        sum(deleted_bytes) as deleted_bytes from public.scan_summaries
        where organization_id = v_org group by 1) as grouped), '[]'::jsonb)
  ) into v_result from public.scan_summaries where organization_id = v_org;
  return v_result;
end $$;

revoke all on function public.create_organization(text), public.create_invite(integer, integer),
  public.join_organization(text, text), public.list_invites(), public.revoke_invite(uuid),
  public.update_organization_settings(bigint, integer, integer),
  public.submit_scan(uuid, timestamptz, integer, bigint, integer, bigint, integer, jsonb, jsonb),
  public.record_cleanup(uuid, integer, bigint), public.get_admin_dashboard() from public, anon;
grant execute on function public.create_organization(text), public.create_invite(integer, integer),
  public.join_organization(text, text), public.list_invites(), public.revoke_invite(uuid),
  public.update_organization_settings(bigint, integer, integer),
  public.submit_scan(uuid, timestamptz, integer, bigint, integer, bigint, integer, jsonb, jsonb),
  public.record_cleanup(uuid, integer, bigint), public.get_admin_dashboard() to authenticated;
