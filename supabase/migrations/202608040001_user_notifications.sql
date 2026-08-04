begin;

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  issue_email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.notification_outbox(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete restrict,
  recipient_email text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  processed_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  unique (outbox_id, recipient_profile_id)
);

create index notification_deliveries_pending_idx
  on public.notification_deliveries(status, available_at)
  where status in ('pending', 'failed');
create index notification_deliveries_recipient_idx
  on public.notification_deliveries(recipient_profile_id, created_at desc);

create trigger notification_preferences_touch before update on public.notification_preferences
for each row execute function public.touch_updated_at();

insert into public.notification_preferences(profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;

create or replace function public.create_profile_notification_preferences()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_preferences(profile_id) values (new.id)
  on conflict (profile_id) do nothing;
  return new;
end;
$$;

create trigger profile_notification_preferences_created
after insert on public.profiles
for each row execute function public.create_profile_notification_preferences();

create or replace function public.set_my_issue_email_subscription(p_enabled boolean)
returns public.notification_preferences
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_after public.notification_preferences;
begin
  if v_actor is null or public.current_user_role() is null then
    raise exception using errcode = '42501', message = 'Active account required';
  end if;
  insert into public.notification_preferences(profile_id, issue_email_enabled)
  values (v_actor, p_enabled)
  on conflict (profile_id) do update set issue_email_enabled = excluded.issue_email_enabled
  returning * into v_after;
  insert into public.audit_events(entity_type, entity_id, action, actor_id, after_data)
  values ('profile', v_actor, 'notification_subscription_changed', v_actor, to_jsonb(v_after));
  return v_after;
end;
$$;

create or replace function public.admin_update_user_access(
  p_profile_id uuid,
  p_role public.user_role,
  p_active boolean,
  p_issue_email_enabled boolean
) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_before public.profiles;
  v_after public.profiles;
begin
  if v_actor is null or public.current_user_role() <> 'administrator' then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  select * into v_before from public.profiles where id = p_profile_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'User not found'; end if;
  if p_profile_id = v_actor and (p_role <> v_before.role or not p_active) then
    raise exception using errcode = 'P0001', message = 'You cannot demote or deactivate your own account';
  end if;
  update public.profiles set role = p_role, active = p_active
  where id = p_profile_id returning * into v_after;
  insert into public.notification_preferences(profile_id, issue_email_enabled)
  values (p_profile_id, p_issue_email_enabled)
  on conflict (profile_id) do update set issue_email_enabled = excluded.issue_email_enabled;
  insert into public.audit_events(entity_type, entity_id, action, actor_id, before_data, after_data, metadata)
  values ('profile', p_profile_id, 'user_access_updated', v_actor, to_jsonb(v_before), to_jsonb(v_after),
    jsonb_build_object('issue_email_enabled', p_issue_email_enabled));
  return v_after;
end;
$$;

create or replace function public.fan_out_issue_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.event_type = 'issue_reported' then
    insert into public.notification_deliveries(
      outbox_id, recipient_profile_id, recipient_email, payload
    )
    select
      new.id,
      p.id,
      p.email,
      jsonb_build_object(
        'event_type', 'issue_reported',
        'issue_id', si.id,
        'tray_code', t.tray_code,
        'sample_number', s.sample_number,
        'category_name', c.name,
        'processing_stage', si.processing_stage,
        'ownership', si.ownership_snapshot,
        'comment', si.comment,
        'reported_at', si.reported_at,
        'reported_by', reporter.display_name
      )
    from public.sample_issues si
    join public.trays t on t.id = si.tray_id
    join public.samples s on s.id = si.sample_id
    join public.issue_categories c on c.id = si.category_id
    join public.profiles reporter on reporter.id = si.reported_by
    join public.notification_preferences pref on true
    join public.profiles p on p.id = pref.profile_id
    where si.id = new.aggregate_id
      and pref.issue_email_enabled
      and p.active
    on conflict (outbox_id, recipient_profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger notification_outbox_issue_fanout
after insert on public.notification_outbox
for each row execute function public.fan_out_issue_notification();

create or replace function public.claim_notification_deliveries(p_limit integer default 20)
returns setof public.notification_deliveries
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role required';
  end if;
  update public.notification_deliveries
  set status = 'failed', available_at = now(), last_error = 'Delivery claim expired'
  where status = 'processing' and claimed_at < now() - interval '10 minutes';
  return query
  with candidates as (
    select id from public.notification_deliveries
    where status in ('pending', 'failed')
      and available_at <= now()
      and attempts < 5
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 100))
  )
  update public.notification_deliveries d
  set status = 'processing', attempts = d.attempts + 1, claimed_at = now(), last_error = null
  from candidates c where d.id = c.id
  returning d.*;
end;
$$;

revoke all on function public.set_my_issue_email_subscription(boolean) from public;
revoke all on function public.admin_update_user_access(uuid, public.user_role, boolean, boolean) from public;
revoke all on function public.claim_notification_deliveries(integer) from public;
grant execute on function public.set_my_issue_email_subscription(boolean) to authenticated;
grant execute on function public.admin_update_user_access(uuid, public.user_role, boolean, boolean) to authenticated;
grant execute on function public.claim_notification_deliveries(integer) to service_role;

alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;
grant select, insert, update on public.notification_preferences to authenticated;
grant select on public.notification_deliveries to authenticated;

create policy notification_preferences_read on public.notification_preferences for select to authenticated
using (profile_id = auth.uid() or public.current_user_role() = 'administrator');
create policy notification_preferences_self_insert on public.notification_preferences for insert to authenticated
with check (profile_id = auth.uid() or public.current_user_role() = 'administrator');
create policy notification_preferences_self_update on public.notification_preferences for update to authenticated
using (profile_id = auth.uid() or public.current_user_role() = 'administrator')
with check (profile_id = auth.uid() or public.current_user_role() = 'administrator');
create policy notification_deliveries_read on public.notification_deliveries for select to authenticated
using (recipient_profile_id = auth.uid() or public.current_user_role() = 'administrator');

commit;
