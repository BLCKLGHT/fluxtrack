begin;

create extension if not exists pgcrypto;

create type public.user_role as enum ('process_operator', 'team_viewer', 'administrator');
create type public.tray_status as enum ('created', 'received', 'in_progress', 'completed', 'reopened');
create type public.sample_status as enum ('pending', 'issue_reported', 'processed');
create type public.processing_stage as enum ('pressing', 'xray_analysis', 'other');
create type public.issue_ownership as enum ('potrooms', 'laboratory', 'equipment', 'unclassified');
create type public.issue_record_status as enum ('active', 'superseded', 'voided');
create type public.notification_event_type as enum ('issue_reported', 'tray_completed', 'tray_reopened');
create type public.notification_status as enum ('pending', 'processing', 'sent', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 120),
  email text not null,
  role public.user_role not null default 'process_operator',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trays (
  id uuid primary key default gen_random_uuid(),
  tray_code text unique not null check (tray_code ~ '^[A-Z0-9-]{3,40}$'),
  tray_name text not null,
  source text not null,
  status public.tray_status not null default 'created',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  received_at timestamptz,
  received_by uuid references public.profiles(id),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  reopened_at timestamptz,
  reopened_by uuid references public.profiles(id),
  reopen_reason text,
  version integer not null default 1 check (version > 0)
);

create table public.samples (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid not null references public.trays(id) on delete restrict,
  sample_number text not null check (length(sample_number) between 1 and 40),
  pot_cell_number integer,
  status public.sample_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (tray_id, sample_number),
  unique (id, tray_id)
);

create table public.issue_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-Z0-9_]{2,40}$'),
  name text unique not null,
  description text,
  default_stage public.processing_stage,
  ownership public.issue_ownership not null default 'unclassified',
  requires_comment boolean not null default false,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sample_issues (
  id uuid primary key,
  tray_id uuid not null references public.trays(id) on delete restrict,
  sample_id uuid not null,
  category_id uuid not null references public.issue_categories(id) on delete restrict,
  processing_stage public.processing_stage not null,
  comment text check (comment is null or length(comment) <= 2000),
  ownership_snapshot public.issue_ownership not null,
  reported_by uuid not null references public.profiles(id),
  reported_at timestamptz not null default now(),
  photo_storage_path text not null unique,
  photo_mime_type text not null check (photo_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  photo_size_bytes bigint not null check (photo_size_bytes > 0 and photo_size_bytes <= 12582912),
  idempotency_key uuid unique not null,
  status public.issue_record_status not null default 'active',
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint issue_sample_belongs_to_tray
    foreign key (sample_id, tray_id) references public.samples(id, tray_id) on delete restrict
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  before_data jsonb,
  after_data jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type public.notification_event_type not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index trays_status_idx on public.trays(status);
create index samples_number_idx on public.samples(sample_number);
create index samples_tray_status_idx on public.samples(tray_id, status);
create index sample_issues_tray_reported_idx on public.sample_issues(tray_id, reported_at desc);
create index sample_issues_sample_idx on public.sample_issues(sample_id);
create index sample_issues_category_idx on public.sample_issues(category_id);
create index sample_issues_ownership_idx on public.sample_issues(ownership_snapshot);
create index sample_issues_status_idx on public.sample_issues(status);
create index audit_entity_idx on public.audit_events(entity_type, entity_id, occurred_at desc);
create index outbox_pending_idx on public.notification_outbox(status, available_at) where status = 'pending';

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger categories_touch before update on public.issue_categories
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'operator'), '@', 1)),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.log_tray_received(
  p_tray_id uuid,
  p_expected_version integer default null
) returns public.trays
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_before public.trays;
  v_after public.trays;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() not in ('process_operator', 'administrator') then
    raise exception using errcode = '42501', message = 'Not authorised to receive trays';
  end if;

  select * into v_before from public.trays where id = p_tray_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Tray not found'; end if;
  if v_before.status <> 'created' then
    raise exception using errcode = 'P0001', message = 'Tray is not awaiting receipt';
  end if;
  if p_expected_version is not null and v_before.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Tray changed; refresh and try again';
  end if;

  update public.trays set
    status = 'received', received_at = now(), received_by = v_actor, version = version + 1
  where id = p_tray_id returning * into v_after;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, before_data, after_data)
  values ('tray', p_tray_id, 'tray_received', v_actor, to_jsonb(v_before), to_jsonb(v_after));
  return v_after;
end;
$$;

create or replace function public.create_sample_issue(
  p_issue_id uuid,
  p_tray_id uuid,
  p_sample_id uuid,
  p_category_id uuid,
  p_processing_stage public.processing_stage,
  p_comment text,
  p_photo_storage_path text,
  p_photo_mime_type text,
  p_photo_size_bytes bigint,
  p_idempotency_key uuid
) returns public.sample_issues
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_tray public.trays;
  v_category public.issue_categories;
  v_existing public.sample_issues;
  v_issue public.sample_issues;
  v_expected_prefix text;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() not in ('process_operator', 'administrator') then
    raise exception using errcode = '42501', message = 'Not authorised to report issues';
  end if;
  select * into v_existing from public.sample_issues where idempotency_key = p_idempotency_key;
  if found then return v_existing; end if;

  select * into v_tray from public.trays where id = p_tray_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Tray not found'; end if;
  if v_tray.status not in ('received', 'in_progress', 'reopened') then
    raise exception using errcode = 'P0001', message = 'Tray must be received and not completed';
  end if;
  if not exists (select 1 from public.samples where id = p_sample_id and tray_id = p_tray_id) then
    raise exception using errcode = 'P0002', message = 'Sample does not belong to this tray';
  end if;
  select * into v_category from public.issue_categories where id = p_category_id and active;
  if not found then raise exception using errcode = 'P0002', message = 'Issue category is unavailable'; end if;
  if v_category.requires_comment and nullif(btrim(p_comment), '') is null then
    raise exception using errcode = '23514', message = 'A comment is required for this category';
  end if;
  if p_photo_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
     or p_photo_size_bytes <= 0 or p_photo_size_bytes > 12582912 then
    raise exception using errcode = '23514', message = 'Invalid photograph';
  end if;

  v_expected_prefix := p_tray_id::text || '/' || p_sample_id::text || '/' || p_issue_id::text || '/';
  if left(p_photo_storage_path, length(v_expected_prefix)) <> v_expected_prefix
     or p_photo_storage_path like '%..%' then
    raise exception using errcode = '23514', message = 'Invalid photograph path';
  end if;

  insert into public.sample_issues (
    id, tray_id, sample_id, category_id, processing_stage, comment,
    ownership_snapshot, reported_by, photo_storage_path, photo_mime_type,
    photo_size_bytes, idempotency_key
  ) values (
    p_issue_id, p_tray_id, p_sample_id, p_category_id, p_processing_stage,
    nullif(btrim(p_comment), ''), v_category.ownership, v_actor,
    p_photo_storage_path, p_photo_mime_type, p_photo_size_bytes, p_idempotency_key
  ) returning * into v_issue;

  update public.samples set status = 'issue_reported' where id = p_sample_id;
  update public.trays set
    status = case when status in ('received', 'reopened') then 'in_progress' else status end,
    version = version + 1
  where id = p_tray_id;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, after_data, metadata)
  values ('sample_issue', v_issue.id, 'issue_reported', v_actor, to_jsonb(v_issue),
    jsonb_build_object('tray_id', p_tray_id, 'sample_id', p_sample_id));
  insert into public.notification_outbox(event_type, aggregate_type, aggregate_id, payload)
  values ('issue_reported', 'sample_issue', v_issue.id,
    jsonb_build_object('tray_id', p_tray_id, 'sample_id', p_sample_id, 'category_id', p_category_id));
  return v_issue;
exception
  when unique_violation then
    select * into v_existing from public.sample_issues where idempotency_key = p_idempotency_key;
    if found then return v_existing; end if;
    raise;
end;
$$;

create or replace function public.complete_tray(
  p_tray_id uuid,
  p_expected_version integer default null
) returns public.trays
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_before public.trays;
  v_after public.trays;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() not in ('process_operator', 'administrator') then
    raise exception using errcode = '42501', message = 'Not authorised to complete trays';
  end if;
  select * into v_before from public.trays where id = p_tray_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Tray not found'; end if;
  if v_before.status not in ('received', 'in_progress', 'reopened') then
    raise exception using errcode = 'P0001', message = 'Tray cannot be completed in its current state';
  end if;
  if p_expected_version is not null and v_before.version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Tray changed; refresh and try again';
  end if;

  update public.samples set status = 'processed'
  where tray_id = p_tray_id and status = 'pending';
  update public.trays set status = 'completed', completed_at = now(),
    completed_by = v_actor, version = version + 1
  where id = p_tray_id returning * into v_after;
  insert into public.audit_events(entity_type, entity_id, action, actor_id, before_data, after_data)
  values ('tray', p_tray_id, 'tray_completed', v_actor, to_jsonb(v_before), to_jsonb(v_after));
  insert into public.notification_outbox(event_type, aggregate_type, aggregate_id, payload)
  values ('tray_completed', 'tray', p_tray_id, jsonb_build_object('tray_code', v_after.tray_code));
  return v_after;
end;
$$;

create or replace function public.reopen_tray(p_tray_id uuid, p_reason text)
returns public.trays
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_before public.trays;
  v_after public.trays;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() <> 'administrator' then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception using errcode = '23514', message = 'A meaningful reopen reason is required';
  end if;
  select * into v_before from public.trays where id = p_tray_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Tray not found'; end if;
  if v_before.status <> 'completed' then
    raise exception using errcode = 'P0001', message = 'Only a completed tray can be reopened';
  end if;
  update public.trays set status = 'reopened', reopened_at = now(), reopened_by = v_actor,
    reopen_reason = btrim(p_reason), version = version + 1
  where id = p_tray_id returning * into v_after;
  insert into public.audit_events(entity_type, entity_id, action, actor_id, before_data, after_data, reason)
  values ('tray', p_tray_id, 'tray_reopened', v_actor, to_jsonb(v_before), to_jsonb(v_after), btrim(p_reason));
  insert into public.notification_outbox(event_type, aggregate_type, aggregate_id, payload)
  values ('tray_reopened', 'tray', p_tray_id, jsonb_build_object('tray_code', v_after.tray_code, 'reason', btrim(p_reason)));
  return v_after;
end;
$$;

create or replace function public.void_issue(p_issue_id uuid, p_reason text)
returns public.sample_issues
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_before public.sample_issues;
  v_after public.sample_issues;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() <> 'administrator' then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception using errcode = '23514', message = 'A meaningful void reason is required';
  end if;
  select * into v_before from public.sample_issues where id = p_issue_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Issue not found'; end if;
  if v_before.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'Issue is not active';
  end if;
  update public.sample_issues set status = 'voided', voided_at = now(),
    voided_by = v_actor, void_reason = btrim(p_reason)
  where id = p_issue_id returning * into v_after;
  insert into public.audit_events(entity_type, entity_id, action, actor_id, before_data, after_data, reason)
  values ('sample_issue', p_issue_id, 'issue_voided', v_actor, to_jsonb(v_before), to_jsonb(v_after), btrim(p_reason));
  return v_after;
end;
$$;

revoke all on function public.log_tray_received(uuid, integer) from public;
revoke all on function public.create_sample_issue(uuid, uuid, uuid, uuid, public.processing_stage, text, text, text, bigint, uuid) from public;
revoke all on function public.complete_tray(uuid, integer) from public;
revoke all on function public.reopen_tray(uuid, text) from public;
revoke all on function public.void_issue(uuid, text) from public;
grant execute on function public.log_tray_received(uuid, integer) to authenticated;
grant execute on function public.create_sample_issue(uuid, uuid, uuid, uuid, public.processing_stage, text, text, text, bigint, uuid) to authenticated;
grant execute on function public.complete_tray(uuid, integer) to authenticated;
grant execute on function public.reopen_tray(uuid, text) to authenticated;
grant execute on function public.void_issue(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.trays enable row level security;
alter table public.samples enable row level security;
alter table public.issue_categories enable row level security;
alter table public.sample_issues enable row level security;
alter table public.audit_events enable row level security;
alter table public.notification_outbox enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated
using (id = auth.uid() or public.current_user_role() in ('team_viewer', 'administrator'));
create policy profiles_admin_update on public.profiles for update to authenticated
using (public.current_user_role() = 'administrator')
with check (public.current_user_role() = 'administrator');

create policy trays_authenticated_read on public.trays for select to authenticated
using (public.current_user_role() is not null);
create policy trays_admin_insert on public.trays for insert to authenticated
with check (public.current_user_role() = 'administrator');
create policy trays_admin_update on public.trays for update to authenticated
using (public.current_user_role() = 'administrator')
with check (public.current_user_role() = 'administrator');

create policy samples_authenticated_read on public.samples for select to authenticated
using (public.current_user_role() is not null);
create policy samples_admin_manage on public.samples for all to authenticated
using (public.current_user_role() = 'administrator')
with check (public.current_user_role() = 'administrator');

create policy categories_authenticated_read on public.issue_categories for select to authenticated
using (public.current_user_role() is not null);
create policy categories_admin_manage on public.issue_categories for all to authenticated
using (public.current_user_role() = 'administrator')
with check (public.current_user_role() = 'administrator');

create policy issues_authenticated_read on public.sample_issues for select to authenticated
using (public.current_user_role() is not null);

create policy audit_admin_read on public.audit_events for select to authenticated
using (public.current_user_role() = 'administrator');
create policy outbox_admin_read on public.notification_outbox for select to authenticated
using (public.current_user_role() = 'administrator');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sample-issue-photos', 'sample-issue-photos', false, 12582912,
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy issue_photo_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'sample-issue-photos'
  and public.current_user_role() in ('process_operator', 'administrator')
  and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  and (storage.foldername(name))[3] ~ '^[0-9a-f-]{36}$'
  and exists (
    select 1
    from public.samples s
    join public.trays t on t.id = s.tray_id
    where s.tray_id = ((storage.foldername(name))[1])::uuid
      and s.id = ((storage.foldername(name))[2])::uuid
      and t.status in ('received', 'in_progress', 'reopened')
  )
);
create policy issue_photo_authorised_read on storage.objects for select to authenticated
using (
  bucket_id = 'sample-issue-photos'
  and public.current_user_role() in ('process_operator', 'team_viewer', 'administrator')
);

commit;
