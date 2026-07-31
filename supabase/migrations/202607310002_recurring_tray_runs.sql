begin;

create table public.tray_templates (
  id uuid primary key default gen_random_uuid(),
  tray_code text unique not null check (tray_code ~ '^[A-Z0-9-]{3,35}$'),
  tray_name text not null check (length(tray_name) between 1 and 120),
  source text not null check (length(source) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.tray_template_samples (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.tray_templates(id) on delete restrict,
  sample_number text not null check (length(sample_number) between 1 and 40),
  pot_cell_number integer,
  display_order integer not null,
  created_at timestamptz not null default now(),
  unique (template_id, sample_number),
  unique (template_id, display_order)
);

alter table public.trays
  add column template_id uuid references public.tray_templates(id) on delete restrict,
  add column run_number integer check (run_number is null or run_number > 0),
  add column processing_date date not null default current_date;

create unique index trays_template_run_unique_idx
  on public.trays(template_id, run_number)
  where template_id is not null;
create index trays_template_created_idx on public.trays(template_id, created_at desc);
create index tray_templates_active_idx on public.tray_templates(active, tray_code);
create index tray_template_samples_template_idx on public.tray_template_samples(template_id, display_order);

create trigger tray_templates_touch before update on public.tray_templates
for each row execute function public.touch_updated_at();

-- Convert the original prototype tray into the first processing run of a
-- reusable physical tray. Historical run identifiers remain unchanged.
insert into public.tray_templates (id, tray_code, tray_name, source, created_at, created_by)
select gen_random_uuid(), t.tray_code, t.tray_name, t.source, t.created_at, t.created_by
from public.trays t
where t.tray_code = 'FLUX-TEST-001'
  and not exists (
    select 1 from public.tray_templates tt where tt.tray_code = t.tray_code
  );

insert into public.tray_template_samples
  (template_id, sample_number, pot_cell_number, display_order, created_at)
select
  tt.id,
  s.sample_number,
  s.pot_cell_number,
  row_number() over (
    partition by s.tray_id
    order by s.pot_cell_number nulls last, s.sample_number
  )::integer,
  s.created_at
from public.trays t
join public.tray_templates tt on tt.tray_code = t.tray_code
join public.samples s on s.tray_id = t.id
where t.tray_code = 'FLUX-TEST-001'
on conflict (template_id, sample_number) do nothing;

update public.trays t
set template_id = tt.id,
    run_number = 1,
    processing_date = t.created_at::date
from public.tray_templates tt
where t.tray_code = 'FLUX-TEST-001'
  and tt.tray_code = 'FLUX-TEST-001'
  and t.template_id is null;

create or replace function public.start_tray_run(p_template_id uuid)
returns public.trays
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_template public.tray_templates;
  v_existing public.trays;
  v_run public.trays;
  v_run_number integer;
  v_run_code text;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() not in ('process_operator', 'administrator') then
    raise exception using errcode = '42501', message = 'Not authorised to start tray runs';
  end if;

  select * into v_template
  from public.tray_templates
  where id = p_template_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Physical tray not found';
  end if;
  if not v_template.active then
    raise exception using errcode = 'P0001', message = 'Physical tray is inactive';
  end if;
  if not exists (
    select 1 from public.tray_template_samples where template_id = p_template_id
  ) then
    raise exception using errcode = 'P0001', message = 'Physical tray has no configured samples';
  end if;

  -- One physical tray can only have one open run. Repeated scans are
  -- idempotent and resume that run instead of creating a duplicate.
  select * into v_existing
  from public.trays
  where template_id = p_template_id
    and status in ('created', 'received', 'in_progress', 'reopened')
  order by created_at desc
  limit 1
  for update;
  if found then return v_existing; end if;

  select coalesce(max(run_number), 0) + 1 into v_run_number
  from public.trays where template_id = p_template_id;
  v_run_code := v_template.tray_code || '-R' || lpad(v_run_number::text, 3, '0');

  insert into public.trays (
    tray_code, tray_name, source, status, created_by,
    template_id, run_number, processing_date
  ) values (
    v_run_code, v_template.tray_name, v_template.source, 'created', v_actor,
    p_template_id, v_run_number, current_date
  ) returning * into v_run;

  insert into public.samples (tray_id, sample_number, pot_cell_number)
  select v_run.id, sample_number, pot_cell_number
  from public.tray_template_samples
  where template_id = p_template_id
  order by display_order;

  insert into public.audit_events(entity_type, entity_id, action, actor_id, after_data, metadata)
  values (
    'tray', v_run.id, 'tray_run_created', v_actor, to_jsonb(v_run),
    jsonb_build_object('template_id', p_template_id, 'physical_tray_code', v_template.tray_code)
  );
  return v_run;
end;
$$;

create or replace function public.create_tray_template(
  p_tray_code text,
  p_tray_name text,
  p_source text,
  p_sample_numbers text[]
) returns public.tray_templates
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_template public.tray_templates;
  v_count integer;
  v_distinct_count integer;
begin
  if v_actor is null or public.current_user_role() is null
     or public.current_user_role() <> 'administrator' then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  p_tray_code := upper(btrim(p_tray_code));
  if p_tray_code !~ '^[A-Z0-9-]{3,35}$' then
    raise exception using errcode = '23514', message = 'Invalid physical tray code';
  end if;
  if length(btrim(coalesce(p_tray_name, ''))) not between 1 and 120
     or length(btrim(coalesce(p_source, ''))) not between 1 and 120 then
    raise exception using errcode = '23514', message = 'Tray name and source are required';
  end if;

  v_count := coalesce(array_length(p_sample_numbers, 1), 0);
  select count(distinct btrim(value)) into v_distinct_count
  from unnest(p_sample_numbers) as value
  where btrim(value) <> '';
  if v_count < 1 or v_count > 50 or v_distinct_count <> v_count then
    raise exception using errcode = '23514', message = 'Provide 1 to 50 unique sample numbers';
  end if;

  insert into public.tray_templates (tray_code, tray_name, source, created_by)
  values (p_tray_code, btrim(p_tray_name), btrim(p_source), v_actor)
  returning * into v_template;

  insert into public.tray_template_samples
    (template_id, sample_number, pot_cell_number, display_order)
  select
    v_template.id,
    btrim(value),
    case when btrim(value) ~ '^\d+$' then btrim(value)::integer else null end,
    ordinal::integer
  from unnest(p_sample_numbers) with ordinality as samples(value, ordinal);

  insert into public.audit_events(entity_type, entity_id, action, actor_id, after_data)
  values ('tray_template', v_template.id, 'tray_template_created', v_actor, to_jsonb(v_template));
  return v_template;
end;
$$;

revoke all on function public.start_tray_run(uuid) from public;
revoke all on function public.create_tray_template(text, text, text, text[]) from public;
grant execute on function public.start_tray_run(uuid) to authenticated;
grant execute on function public.create_tray_template(text, text, text, text[]) to authenticated;

alter table public.tray_templates enable row level security;
alter table public.tray_template_samples enable row level security;

grant select, insert, update, delete on public.tray_templates to authenticated;
grant select, insert, update, delete on public.tray_template_samples to authenticated;

create policy tray_templates_authenticated_read on public.tray_templates for select to authenticated
using (public.current_user_role() is not null);
create policy tray_templates_admin_manage on public.tray_templates for all to authenticated
using (public.current_user_role() = 'administrator')
with check (public.current_user_role() = 'administrator');

create policy tray_template_samples_authenticated_read on public.tray_template_samples for select to authenticated
using (public.current_user_role() is not null);
create policy tray_template_samples_admin_manage on public.tray_template_samples for all to authenticated
using (public.current_user_role() = 'administrator')
with check (public.current_user_role() = 'administrator');

commit;
